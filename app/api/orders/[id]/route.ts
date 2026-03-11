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
    await confirmOrder(order);
    return NextResponse.json({ ok: true });
  }

  await prisma.order.update({ where: { id }, data: { status: body.status } });

  return NextResponse.json({ ok: true });
}
