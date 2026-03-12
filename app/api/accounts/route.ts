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
    price1m: Number(body.price1m) || 0,
    price3m: Number(body.price3m) || 0,
    price6m: Number(body.price6m) || 0,
    price12m: Number(body.price12m) || 0,
    renewalDate: body.renewalDate,
    slug: body.slug?.trim() || undefined,
    notes: body.notes || "",
    joinLink: body.joinLink || "",
    requireEmail: body.requireEmail || false,
    shareType: body.shareType || "account",
    imapEmail: body.imapEmail || "",
    imapPassword: body.imapPassword || "",
  });
  return NextResponse.json(account, { status: 201 });
}
