import { NextRequest, NextResponse } from "next/server";
import { promoCodesDB } from "@/lib/db";

// Public API: validate promo code
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
  }

  const promo = await promoCodesDB.getByCode(code);
  if (!promo) {
    return NextResponse.json({ error: "Mã giảm giá không tồn tại" }, { status: 404 });
  }

  if (!promo.active) {
    return NextResponse.json({ error: "Mã giảm giá đã ngừng hoạt động" }, { status: 400 });
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
  }

  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
  }

  // Check if promo applies to the specific account
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (promo.applicableAccountIds.length > 0 && accountId) {
    if (!promo.applicableAccountIds.includes(accountId)) {
      return NextResponse.json({ error: "Mã giảm giá không áp dụng cho dịch vụ này" }, { status: 400 });
    }
  }

  return NextResponse.json({
    id: promo.id,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
  });
}
