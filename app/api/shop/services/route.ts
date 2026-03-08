import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsDB } from "@/lib/db";

export async function GET() {
  // Get all accounts with available slots
  const [accounts, settings] = await Promise.all([
    prisma.account.findMany({
      include: {
        service: true,
        _count: { select: { subscriptions: { where: { status: "active" } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    settingsDB.get(),
  ]);

  // Filter only accounts with free slots
  const available = accounts
    .filter(a => a._count.subscriptions < a.totalSlots)
    .map(a => ({
      id: a.id,
      serviceType: a.service.type,
      serviceName: a.service.name,
      serviceIcon: a.service.icon,
      monthlyFee: a.monthlyFee,
      totalSlots: a.totalSlots,
      usedSlots: a._count.subscriptions,
      freeSlots: a.totalSlots - a._count.subscriptions,
      requireEmail: a.requireEmail,
    }));

  // Group by service type
  const grouped: Record<string, typeof available> = {};
  for (const item of available) {
    if (!grouped[item.serviceType]) grouped[item.serviceType] = [];
    grouped[item.serviceType].push(item);
  }

  return NextResponse.json({
    services: grouped,
    shopDescription: settings.shopDescription || "Đăng ký dịch vụ với giá tốt nhất",
  });
}
