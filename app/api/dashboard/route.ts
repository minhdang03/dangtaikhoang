import { NextResponse } from "next/server";
import { accountsDB, usersDB, subscriptionsDB, paymentsDB, servicesDB } from "@/lib/db";
import { currentMonth, daysUntil } from "@/lib/utils";

export async function GET() {
  const accounts = accountsDB.getAll();
  const users = usersDB.getAll();
  const subscriptions = subscriptionsDB.getAll().filter(s => s.status === "active");
  const payments = paymentsDB.getAll();
  const services = servicesDB.getAll();
  const month = currentMonth();

  const monthPayments = payments.filter(p => p.month === month);
  const pendingPayments = monthPayments.filter(p => p.status === "pending");
  const paidPayments = monthPayments.filter(p => p.status === "paid");

  const expiringAccounts = accounts
    .map(a => ({ ...a, daysLeft: daysUntil(a.renewalDate) }))
    .filter(a => a.daysLeft <= 7 && a.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({
    stats: {
      totalAccounts: accounts.length,
      totalUsers: users.length,
      activeSlots: subscriptions.length,
      totalRevenue,
      pendingRevenue,
    },
    expiringAccounts: expiringAccounts.map(a => ({
      ...a,
      service: services.find(s => s.id === a.serviceId),
    })),
    pendingPayments: pendingPayments.slice(0, 10).map(p => ({
      ...p,
      user: users.find(u => u.id === p.userId),
      account: (() => {
        const acc = accounts.find(a => a.id === p.accountId);
        return acc ? { ...acc, service: services.find(s => s.id === acc.serviceId) } : null;
      })(),
    })),
    month,
  });
}
