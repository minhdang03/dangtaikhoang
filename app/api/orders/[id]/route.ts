import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmOrder } from "@/lib/order-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { account: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status === "confirmed") {
    // Check account có slot trống — nếu hết, tự tìm account khác cùng service
    const activeCount = await prisma.subscription.count({
      where: { accountId: order.accountId, status: "active" },
    });

    let resolvedOrder = order;
    if (activeCount >= order.account.totalSlots) {
      // Tìm account khác cùng service còn slot
      const alt = await prisma.account.findFirst({
        where: {
          serviceId: order.account.serviceId,
          id: { not: order.accountId },
        },
        include: {
          _count: { select: { subscriptions: { where: { status: "active" } } } },
        },
      });

      if (alt && alt._count.subscriptions < alt.totalSlots) {
        // Gán order sang account mới
        await prisma.order.update({ where: { id }, data: { accountId: alt.id } });
        resolvedOrder = { ...order, accountId: alt.id };
      } else {
        return NextResponse.json(
          { error: `Hết slot! "${order.account.label}" đầy (${activeCount}/${order.account.totalSlots}) và không có account nào khác trống. Thêm account mới trước.` },
          { status: 409 }
        );
      }
    }

    await confirmOrder(resolvedOrder);
    return NextResponse.json({ ok: true });
  }

  await prisma.order.update({ where: { id }, data: { status: body.status } });

  return NextResponse.json({ ok: true });
}
