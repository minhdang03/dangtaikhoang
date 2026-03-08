import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({
    where: { status: "pending" },
    include: { account: { include: { service: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Auto-mark expired ones
  const now = new Date();
  const result = await Promise.all(orders.map(async o => {
    if (new Date(o.expiresAt) < now) {
      await prisma.order.update({ where: { id: o.id }, data: { status: "expired" } });
      return null;
    }
    return {
      id: o.id,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerFb: o.customerFb,
      amount: o.amount,
      customerConfirmed: o.customerConfirmed,
      paymentProof: o.paymentProof,
      serviceName: o.account.service.name,
      serviceIcon: o.account.service.icon,
      accountLabel: o.account.label,
      accountId: o.accountId,
      createdAt: o.createdAt.toISOString(),
      expiresAt: o.expiresAt.toISOString(),
    };
  }));

  return NextResponse.json(result.filter(Boolean));
}
