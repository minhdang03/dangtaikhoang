import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscriptionsDB, paymentsDB } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { account: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status === "confirmed") {
    // Auto-create user (or find by phone), subscription, payment
    let user = await prisma.user.findFirst({
      where: { phone: order.customerPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: order.customerName,
          phone: order.customerPhone,
          fbLink: order.customerFb,
          lookupPin: order.lookupPin,
        },
      });
    } else if (order.lookupPin) {
      // Update PIN if order has one (latest PIN wins)
      await prisma.user.update({
        where: { id: user.id },
        data: { lookupPin: order.lookupPin },
      });
    }

    // Create subscription
    await subscriptionsDB.create({
      userId: user.id,
      accountId: order.accountId,
      slotLabel: "Slot",
      startDate: new Date().toISOString(),
      status: "active",
    });

    // Create payment (paid)
    await paymentsDB.create({
      subscriptionId: (await prisma.subscription.findFirst({
        where: { userId: user.id, accountId: order.accountId, status: "active" },
        orderBy: { createdAt: "desc" },
      }))!.id,
      userId: user.id,
      accountId: order.accountId,
      amount: order.amount,
      month: new Date().toISOString().slice(0, 7),
      status: "paid",
      paidAt: new Date().toISOString(),
      note: `Đơn hàng #${order.id.slice(0, 8)}`,
    });
  }

  await prisma.order.update({ where: { id }, data: { status: body.status } });

  return NextResponse.json({ ok: true });
}
