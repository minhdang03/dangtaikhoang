import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVietQRUrl } from "@/lib/vietqr";
import { settingsDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accountId, customerName, customerPhone, customerFb, lookupPin, duration } = body;

  if (!accountId || !customerName || !customerPhone) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  // Validate duration
  const durationMonths = duration || 1;
  if (![1, 3, 6, 12].includes(durationMonths)) {
    return NextResponse.json({ error: "Thời hạn không hợp lệ" }, { status: 400 });
  }

  // Validate PIN if provided
  const pin = (lookupPin || "").trim();
  if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
    return NextResponse.json({ error: "Mã PIN gồm 4 chữ số" }, { status: 400 });
  }

  // Check account still has free slots
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      service: true,
      _count: { select: { subscriptions: { where: { status: "active" } } } },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Không tìm thấy dịch vụ" }, { status: 404 });
  }
  if (account._count.subscriptions >= account.totalSlots) {
    return NextResponse.json({ error: "Hết slot, vui lòng chọn dịch vụ khác" }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const totalAmount = account.monthlyFee * durationMonths;
  const order = await prisma.order.create({
    data: {
      accountId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerFb: customerFb?.trim() || "",
      lookupPin: pin,
      amount: totalAmount,
      duration: durationMonths,
      status: "pending",
      expiresAt,
    },
  });

  // Generate QR URL
  const settings = await settingsDB.get();
  // Build transfer note from template: {sdt} = customerPhone
  const transferNote = (settings.transferNote || "{sdt}").replace("{sdt}", customerPhone.trim());
  let qrUrl = null;
  if (settings.accountNo && settings.bankBin) {
    qrUrl = generateVietQRUrl({
      bankBin: settings.bankBin,
      accountNo: settings.accountNo,
      accountName: settings.accountName,
      amount: totalAmount,
      description: transferNote,
    });
  }

  return NextResponse.json({
    id: order.id,
    amount: order.amount,
    duration: order.duration,
    serviceName: account.service.name,
    serviceIcon: account.service.icon,
    qrUrl,
    transferNote,
    bankInfo: {
      bankId: settings.bankId,
      accountNo: settings.accountNo,
      accountName: settings.accountName,
    },
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 });
}
