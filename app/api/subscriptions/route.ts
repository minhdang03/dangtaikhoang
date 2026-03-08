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
  const startDate = body.startDate || new Date().toISOString();
  const durationMonths = body.duration || 1;

  // Calculate endDate if not provided
  let endDate = body.endDate || "";
  if (!endDate) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationMonths * 30);
    endDate = end.toISOString();
  }

  const sub = await subscriptionsDB.create({
    userId: body.userId,
    accountId: body.accountId,
    slotLabel: body.slotLabel || "Slot",
    startDate,
    endDate,
    duration: durationMonths,
    status: "active",
  });
  return NextResponse.json(sub, { status: 201 });
}
