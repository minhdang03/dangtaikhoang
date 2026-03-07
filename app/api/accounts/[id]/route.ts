import { NextRequest, NextResponse } from "next/server";
import { accountsDB, servicesDB, subscriptionsDB, usersDB } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await accountsDB.getById(id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [service, subscriptions, users] = await Promise.all([
    servicesDB.getById(account.serviceId),
    subscriptionsDB.getByAccount(id),
    usersDB.getAll(),
  ]);

  const slots = subscriptions.map(s => ({
    ...s,
    user: users.find(u => u.id === s.userId),
  }));

  return NextResponse.json({ ...account, service, slots, activeSlots: slots.length });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await accountsDB.update(id, {
    serviceId: body.serviceId,
    label: body.label,
    email: body.email,
    password: body.password,
    totalSlots: Number(body.totalSlots),
    monthlyFee: Number(body.monthlyFee),
    renewalDate: body.renewalDate,
    notes: body.notes || "",
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await accountsDB.delete(id);
  return NextResponse.json({ ok: true });
}
