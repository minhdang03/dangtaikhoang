import { NextRequest, NextResponse } from "next/server";
import { accountsDB, servicesDB, subscriptionsDB } from "@/lib/db";

export async function GET() {
  const [accounts, services, subscriptions] = await Promise.all([
    accountsDB.getAll(),
    servicesDB.getAll(),
    subscriptionsDB.getAll(),
  ]);
  const activeSubscriptions = subscriptions.filter(s => s.status === "active");

  const result = accounts.map(a => ({
    ...a,
    service: services.find(s => s.id === a.serviceId),
    activeSlots: activeSubscriptions.filter(s => s.accountId === a.id).length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const account = await accountsDB.create({
    serviceId: body.serviceId,
    label: body.label,
    email: body.email,
    password: body.password,
    totalSlots: Number(body.totalSlots),
    monthlyFee: Number(body.monthlyFee),
    renewalDate: body.renewalDate,
    notes: body.notes || "",
  });
  return NextResponse.json(account, { status: 201 });
}
