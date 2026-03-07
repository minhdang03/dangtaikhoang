import { NextRequest, NextResponse } from "next/server";
import { usersDB, subscriptionsDB, paymentsDB, accountsDB, servicesDB } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await usersDB.getById(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [subscriptions, payments, accounts, services] = await Promise.all([
    subscriptionsDB.getByUser(id),
    paymentsDB.getByUser(id),
    accountsDB.getAll(),
    servicesDB.getAll(),
  ]);

  const subs = subscriptions.map(s => {
    const acc = accounts.find(a => a.id === s.accountId);
    return {
      ...s,
      account: acc ? { ...acc, service: services.find(sv => sv.id === acc.serviceId) } : null,
    };
  });

  return NextResponse.json({ ...user, subscriptions: subs, payments });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await usersDB.update(id, {
    name: body.name,
    phone: body.phone,
    fbLink: body.fbLink || "",
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await usersDB.delete(id);
  return NextResponse.json({ ok: true });
}
