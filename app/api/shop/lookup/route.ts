import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  const pin = req.nextUrl.searchParams.get("pin")?.trim();

  if (!phone || phone.length < 4) {
    return NextResponse.json({ error: "Vui lòng nhập SĐT" }, { status: 400 });
  }

  // Find pending orders by phone
  const pendingOrders = await prisma.order.findMany({
    where: { customerPhone: phone, status: "pending" },
    include: { account: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Auto-expire past-due orders
  const now = new Date();
  const activeOrders = [];
  for (const o of pendingOrders) {
    if (o.expiresAt < now) {
      await prisma.order.update({ where: { id: o.id }, data: { status: "expired" } });
    } else {
      activeOrders.push({
        id: o.id,
        serviceName: o.account.service.name,
        serviceIcon: o.account.service.icon,
        amount: o.amount,
        customerConfirmed: o.customerConfirmed,
        expiresAt: o.expiresAt.toISOString(),
      });
    }
  }

  // Find user
  const user = await prisma.user.findFirst({ where: { phone } });

  // --- If PIN provided: verify and return credentials ---
  if (pin) {
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản với số điện thoại này" },
        { status: 403 }
      );
    }

    if (!user.lookupPin || user.lookupPin !== pin) {
      return NextResponse.json(
        { error: "Mã PIN không đúng" },
        { status: 403 }
      );
    }

    // Return full credentials
    const subs = await prisma.subscription.findMany({
      where: { userId: user.id, status: "active" },
      include: { account: { include: { service: true } } },
    });

    const accounts = subs.map(s => ({
      serviceName: s.account.service.name,
      serviceIcon: s.account.service.icon,
      email: s.account.email,
      password: s.account.password,
      slotLabel: s.slotLabel,
      locked: false,
    }));

    return NextResponse.json({
      pendingOrders: activeOrders,
      accounts,
      accountCount: accounts.length,
      customerName: user.name || null,
      verified: true,
    });
  }

  // --- No PIN: return masked accounts (count only) ---
  let accountCount = 0;
  if (user) {
    accountCount = await prisma.subscription.count({
      where: { userId: user.id, status: "active" },
    });
  }

  return NextResponse.json({
    pendingOrders: activeOrders,
    accounts: [],
    accountCount,
    customerName: user?.name || (activeOrders[0] ? pendingOrders[0]?.customerName : null) || null,
    verified: false,
    hasPin: user ? !!user.lookupPin : null, // null = user not found, false = no pin set, true = pin set
  });
}
