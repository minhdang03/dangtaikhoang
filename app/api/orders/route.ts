import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "pending";

  const where = status === "all" ? {} : { status };

  const orders = await prisma.order.findMany({
    where,
    include: { account: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Auto-mark expired pending ones
  const now = new Date();
  const result = await Promise.all(orders.map(async o => {
    if (o.status === "pending" && new Date(o.expiresAt) < now) {
      await prisma.order.update({ where: { id: o.id }, data: { status: "expired" } });
      return status === "all" || status === "expired"
        ? { ...o, status: "expired", createdAt: o.createdAt.toISOString(), expiresAt: o.expiresAt.toISOString() }
        : null;
    }
    return {
      id: o.id,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerFb: o.customerFb,
      amount: o.amount,
      duration: o.duration,
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
