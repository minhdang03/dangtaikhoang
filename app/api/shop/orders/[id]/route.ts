import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsDB } from "@/lib/db";

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

  // Include bank info for payment page
  const settings = await settingsDB.get();

  return NextResponse.json({
    id: order.id,
    status: order.status,
    amount: order.amount,
    customerName: order.customerName,
    customerConfirmed: order.customerConfirmed,
    serviceName: order.account.service.name,
    serviceIcon: order.account.service.icon,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    bankInfo: {
      bankId: settings.bankId,
      accountNo: settings.accountNo,
      accountName: settings.accountName,
    },
  });
}

// Customer confirms payment (optional proof image)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "pending") {
    return NextResponse.json({ error: "Đơn hàng không ở trạng thái chờ" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      customerConfirmed: true,
      paymentProof: body.paymentProof || null,
    },
  });

  return NextResponse.json({
    id: updated.id,
    customerConfirmed: updated.customerConfirmed,
    status: updated.status,
  });
}
