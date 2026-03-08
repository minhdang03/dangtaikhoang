import { NextRequest, NextResponse } from "next/server";
import { subscriptionsDB, accountsDB, usersDB } from "@/lib/db";

export async function GET() {
  const [subs, accounts, users] = await Promise.all([
    subscriptionsDB.getAll(),
    accountsDB.getAll(),
    usersDB.getAll(),
  ]);

  const result = subs.map(s => ({
    ...s,
    user: users.find(u => u.id === s.userId),
    account: accounts.find(a => a.id === s.accountId),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sub = await subscriptionsDB.create({
    userId: body.userId,
    accountId: body.accountId,
    slotLabel: body.slotLabel || "Slot",
    startDate: body.startDate || new Date().toISOString(),
    duration: body.duration || 1,
    status: "active",
  });
  return NextResponse.json(sub, { status: 201 });
}
