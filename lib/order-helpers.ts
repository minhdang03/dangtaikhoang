import { prisma } from "@/lib/prisma";
import { subscriptionsDB, paymentsDB } from "@/lib/db";

/**
 * Xác nhận đơn hàng: tạo user (hoặc tìm theo SĐT), subscription, payment.
 * Dùng chung cho: admin confirm + free order auto-confirm + Telegram approve.
 */
export async function confirmOrder(order: {
  id: string;
  accountId: string;
  customerName: string;
  customerPhone: string;
  customerFb: string;
  lookupPin: string;
  amount: number;
  duration: number | null;
}) {
  // Tìm hoặc tạo user
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
    await prisma.user.update({
      where: { id: user.id },
      data: { lookupPin: order.lookupPin },
    });
  }

  // Tạo subscription
  const startDate = new Date();
  const durationMonths = order.duration || 1;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationMonths * 30);

  await subscriptionsDB.create({
    userId: user.id,
    accountId: order.accountId,
    slotLabel: "Slot",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    duration: durationMonths,
    status: "active",
  });

  // Tạo payment (paid)
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, accountId: order.accountId, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  await paymentsDB.create({
    subscriptionId: sub!.id,
    userId: user.id,
    accountId: order.accountId,
    amount: order.amount,
    month: new Date().toISOString().slice(0, 7),
    status: "paid",
    paidAt: new Date().toISOString(),
    note: `Đơn hàng #${order.id.slice(0, 8)}`,
  });

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "confirmed" },
  });
}
