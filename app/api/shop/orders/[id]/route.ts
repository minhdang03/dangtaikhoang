import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { account: { include: { service: true } } },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-expire if past expiresAt
  if (order.status === "pending" && new Date() > order.expiresAt) {
    await prisma.order.update({ where: { id }, data: { status: "expired" } });
    return NextResponse.json({ ...order, status: "expired" });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    amount: order.amount,
    customerName: order.customerName,
    serviceName: order.account.service.name,
    serviceIcon: order.account.service.icon,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
  });
}
