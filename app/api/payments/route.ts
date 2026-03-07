import { NextRequest, NextResponse } from "next/server";
import { paymentsDB, usersDB, accountsDB, servicesDB, subscriptionsDB } from "@/lib/db";
import { currentMonth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonth();

  const payments = paymentsDB.getByMonth(month);
  const users = usersDB.getAll();
  const accounts = accountsDB.getAll();
  const services = servicesDB.getAll();

  const result = payments.map(p => ({
    ...p,
    user: users.find(u => u.id === p.userId),
    account: (() => {
      const acc = accounts.find(a => a.id === p.accountId);
      return acc ? { ...acc, service: services.find(s => s.id === acc.serviceId) } : null;
    })(),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Support bulk creation for all active subscriptions
  if (body.bulk && body.month) {
    const subs = subscriptionsDB.getAll().filter(s => s.status === "active");
    const accounts = accountsDB.getAll();
    const existingPayments = paymentsDB.getByMonth(body.month);

    const created = [];
    for (const sub of subs) {
      const alreadyExists = existingPayments.some(p => p.subscriptionId === sub.id && p.month === body.month);
      if (alreadyExists) continue;

      const account = accounts.find(a => a.id === sub.accountId);
      if (!account) continue;

      const payment = paymentsDB.create({
        subscriptionId: sub.id,
        userId: sub.userId,
        accountId: sub.accountId,
        amount: account.monthlyFee,
        month: body.month,
        status: "pending",
        paidAt: null,
        note: "",
      });
      created.push(payment);
    }
    return NextResponse.json({ created: created.length, payments: created }, { status: 201 });
  }

  const payment = paymentsDB.create({
    subscriptionId: body.subscriptionId,
    userId: body.userId,
    accountId: body.accountId,
    amount: Number(body.amount),
    month: body.month || currentMonth(),
    status: "pending",
    paidAt: null,
    note: body.note || "",
  });
  return NextResponse.json(payment, { status: 201 });
}
