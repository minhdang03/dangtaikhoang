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

  // For solo accounts: if this one is taken, find another available solo account of same service
  let finalAccount = account;
  const shareType = (account as { shareType?: string }).shareType || "account";
  if (shareType === "solo" && account._count.subscriptions >= account.totalSlots) {
    const alt = await prisma.account.findFirst({
      where: {
        serviceId: account.serviceId,
        shareType: "solo",
        subscriptions: { none: { status: "active" } },
      },
      include: {
        service: true,
        _count: { select: { subscriptions: { where: { status: "active" } } } },
      },
    });
    if (alt) {
      finalAccount = alt as typeof account;
    }
    // Nếu không có alt → vẫn cho đặt hàng (đặt trước), admin sẽ bổ sung account sau
  }
  // Shared/invite accounts: vẫn cho đặt dù hết slot (đặt trước)

  const resolvedAccountId = finalAccount.id;

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  // Lookup price by duration — each duration has its own price (0 = not available)
  const priceMap: Record<number, number> = {
    1: finalAccount.price1m,
    3: finalAccount.price3m,
    6: finalAccount.price6m,
    12: finalAccount.price12m,
  };
  let totalAmount = priceMap[durationMonths] || 0;
  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Gói thời hạn này không khả dụng" }, { status: 400 });
  }

  // Apply promo code discount
  let validPromoId: string | null = null;
  if (promoCodeId) {
    const promo = await promoCodesDB.getById(promoCodeId);
    if (promo && promo.active) {
      const notExpired = !promo.expiresAt || new Date(promo.expiresAt) > new Date();
      const hasUses = promo.maxUses === 0 || promo.usedCount < promo.maxUses;
      const appliesToAccount = promo.applicableAccountIds.length === 0 || promo.applicableAccountIds.includes(resolvedAccountId);
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
      accountId: resolvedAccountId,
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
