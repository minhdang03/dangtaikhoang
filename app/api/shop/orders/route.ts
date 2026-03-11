import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVietQRUrl } from "@/lib/vietqr";
import { settingsDB, promoCodesDB } from "@/lib/db";
import { confirmOrder } from "@/lib/order-helpers";
import { sendTelegramMessage, buildOrderNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accountId, customerName, customerPhone, customerFb, customerEmail, lookupPin, duration, promoCodeId } = body;

  if (!accountId || !customerPhone) {
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
  // Use yearlyFee when buying 12 months and yearlyFee is set
  let totalAmount = (durationMonths === 12 && account.yearlyFee > 0)
    ? account.yearlyFee
    : account.monthlyFee * durationMonths;

  // Apply promo code discount
  let validPromoId: string | null = null;
  if (promoCodeId) {
    const promo = await promoCodesDB.getById(promoCodeId);
    if (promo && promo.active) {
      const notExpired = !promo.expiresAt || new Date(promo.expiresAt) > new Date();
      const hasUses = promo.maxUses === 0 || promo.usedCount < promo.maxUses;
      const appliesToAccount = promo.applicableAccountIds.length === 0 || promo.applicableAccountIds.includes(accountId);
      if (notExpired && hasUses && appliesToAccount) {
        if (promo.discountType === "percent") {
          totalAmount = Math.round(totalAmount * (1 - promo.discountValue / 100));
        } else {
          totalAmount = Math.max(0, totalAmount - promo.discountValue);
        }
        validPromoId = promo.id;
        await promoCodesDB.incrementUsage(promo.id);
      }
    }
  }

  const order = await prisma.order.create({
    data: {
      accountId,
      customerName: (customerName || "").trim(),
      customerPhone: customerPhone.trim(),
      customerFb: customerFb?.trim() || "",
      customerEmail: customerEmail?.trim() || "",
      lookupPin: pin,
      amount: totalAmount,
      duration: durationMonths,
      promoCodeId: validPromoId,
      status: totalAmount === 0 ? "confirmed" : "pending",
      customerConfirmed: totalAmount === 0,
      expiresAt,
    },
  });

  // Đơn hàng miễn phí → tự động xác nhận
  if (totalAmount === 0) {
    await confirmOrder(order);
    return NextResponse.json({
      id: order.id,
      amount: 0,
      duration: order.duration,
      serviceName: account.service.name,
      serviceIcon: account.service.icon,
      status: "confirmed",
    }, { status: 201 });
  }

  // Send Telegram notification (non-blocking)
  const settings = await settingsDB.get();
  if (settings.telegramBotToken && settings.telegramChatId) {
    const notification = buildOrderNotification({
      id: order.id,
      customerPhone: customerPhone.trim(),
      customerName: (customerName || "").trim(),
      serviceName: account.service.name,
      duration: durationMonths,
      amount: totalAmount,
      promoCode: validPromoId ? promoCodeId : undefined,
    });
    sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, notification.text, notification.replyMarkup)
      .catch(console.error);
  }

  // Generate QR URL for paid orders
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
