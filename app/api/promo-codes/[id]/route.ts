import { NextRequest, NextResponse } from "next/server";
import { promoCodesDB } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const code = await promoCodesDB.getById(id);
  if (!code) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(code);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.code !== undefined) updateData.code = body.code;
  if (body.discountType !== undefined) updateData.discountType = body.discountType;
  if (body.discountValue !== undefined) updateData.discountValue = Number(body.discountValue);
  if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt || null;
  if (body.maxUses !== undefined) updateData.maxUses = Number(body.maxUses);
  if (body.active !== undefined) updateData.active = body.active;
  if (body.applicableAccountIds !== undefined) updateData.applicableAccountIds = body.applicableAccountIds;

  const updated = await promoCodesDB.update(id, updateData);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await promoCodesDB.delete(id);
  return NextResponse.json({ ok: true });
}
