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

  type ShopSlot = {
    id: string; slug?: string; serviceType: string; serviceName: string; serviceIcon: string;
    price1m: number; price3m: number; price6m: number; price12m: number;
    totalSlots: number; usedSlots: number;
    freeSlots: number; isFull: boolean; isSolo: boolean; requireEmail: boolean;
  };

  const grouped: Record<string, ShopSlot[]> = {};

  // Separate solo vs shared
  const soloByType: Record<string, typeof accounts> = {};
  for (const a of accounts) {
    const shareType = (a as { shareType?: string }).shareType || "account";
    if (shareType === "solo") {
      if (!soloByType[a.service.type]) soloByType[a.service.type] = [];
      soloByType[a.service.type].push(a);
    } else {
      // shared/invite: show each account individually
      const item: ShopSlot = {
        id: a.id, slug: (a as any).slug || undefined, serviceType: a.service.type, serviceName: a.service.name,
        serviceIcon: a.service.icon, price1m: a.price1m, price3m: a.price3m, price6m: a.price6m, price12m: a.price12m,
        totalSlots: a.totalSlots, usedSlots: a._count.subscriptions,
        freeSlots: a.totalSlots - a._count.subscriptions,
        isFull: a._count.subscriptions >= a.totalSlots,
        isSolo: false, requireEmail: a.requireEmail,
      };
      if (!grouped[item.serviceType]) grouped[item.serviceType] = [];
      grouped[item.serviceType].push(item);
    }
  }

  // Group solo accounts: one card per serviceType showing count
  for (const [type, accs] of Object.entries(soloByType)) {
    const available = accs.filter(a => a._count.subscriptions < a.totalSlots);
    const first = available[0] || accs[0];
    const item: ShopSlot = {
      id: first.id, slug: (first as any).slug || undefined, serviceType: first.service.type, serviceName: first.service.name,
      serviceIcon: first.service.icon, price1m: first.price1m, price3m: first.price3m, price6m: first.price6m, price12m: first.price12m,
      totalSlots: accs.length, usedSlots: accs.length - available.length,
      freeSlots: available.length, isFull: available.length === 0,
      isSolo: true, requireEmail: first.requireEmail,
    };
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(item);
  }

  // Sort within each service group: available > popular/sắp hết > full
  for (const type of Object.keys(grouped)) {
    grouped[type].sort((a, b) => {
      const grpA = a.isFull ? 2 : a.freeSlots <= 2 ? 1 : 0;
      const grpB = b.isFull ? 2 : b.freeSlots <= 2 ? 1 : 0;
      if (grpA !== grpB) return grpA - grpB;
      return b.usedSlots - a.usedSlots; // within same group: more used = more popular
    });
  }

  return NextResponse.json({
    services: grouped,
    shopDescription: settings.shopDescription || "Đăng ký dịch vụ với giá tốt nhất",
    contactFacebook: settings.contactFacebook || "",
    contactTelegram: settings.contactTelegram || "",
  });
}
