import { NextRequest, NextResponse } from "next/server";
import { subscriptionsDB } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await subscriptionsDB.update(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await subscriptionsDB.update(id, { status: "cancelled" });
  return NextResponse.json({ ok: true });
}
