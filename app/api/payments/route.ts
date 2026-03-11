import { NextRequest, NextResponse } from "next/server";
import { paymentsDB, usersDB, accountsDB, servicesDB, subscriptionsDB } from "@/lib/db";
import { currentMonth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonth();

  const [payments, users, accounts, services] = await Promise.all([
    paymentsDB.getByMonth(month),
    usersDB.getAll(),
    accountsDB.getAll(),
    servicesDB.getAll(),
  ]);

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
    const [allSubs, accounts, existingPayments] = await Promise.all([
      subscriptionsDB.getAll(),
      accountsDB.getAll(),
      paymentsDB.getByMonth(body.month),
    ]);
    const subs = allSubs.filter(s => s.status === "active");

    const created = [];
    for (const sub of subs) {
      const alreadyExists = existingPayments.some(p => p.subscriptionId === sub.id && p.month === body.month);
      if (alreadyExists) continue;

      const account = accounts.find(a => a.id === sub.accountId);
      if (!account) continue;

      const payment = await paymentsDB.create({
        subscriptionId: sub.id,
        userId: sub.userId,
        accountId: sub.accountId,
        amount: account.price1m,
        month: body.month,
        status: "pending",
        paidAt: null,
        note: "",
      });
      created.push(payment);
    }
    return NextResponse.json({ created: created.length, payments: created }, { status: 201 });
  }

  const payment = await paymentsDB.create({
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
