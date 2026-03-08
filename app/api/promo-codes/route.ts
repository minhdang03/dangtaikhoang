import { NextRequest, NextResponse } from "next/server";
import { promoCodesDB } from "@/lib/db";

export async function GET() {
  const codes = await promoCodesDB.getAll();
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = await promoCodesDB.create({
    code: body.code,
    discountType: body.discountType || "percent",
    discountValue: Number(body.discountValue),
    expiresAt: body.expiresAt || null,
    maxUses: Number(body.maxUses) || 0,
    active: body.active !== false,
  });
  return NextResponse.json(code, { status: 201 });
}
