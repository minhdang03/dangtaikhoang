import { NextRequest, NextResponse } from "next/server";
import { paymentsDB, usersDB, accountsDB, servicesDB, settingsDB } from "@/lib/db";
import { generateVietQRUrl } from "@/lib/vietqr";
import { paymentDescription as buildDesc } from "@/lib/utils";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await paymentsDB.getById(id);
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [user, account, settings] = await Promise.all([
    usersDB.getById(payment.userId),
    accountsDB.getById(payment.accountId),
    settingsDB.get(),
  ]);
  const service = account ? await servicesDB.getById(account.serviceId) : null;

  let qrUrl = null;
  if (payment.status === "pending" && settings.accountNo && user && account && service) {
    const desc = buildDesc(user.name, service.name, payment.month);
    qrUrl = generateVietQRUrl({
      bankBin: settings.bankBin,
      accountNo: settings.accountNo,
      accountName: settings.accountName,
      amount: payment.amount,
      description: desc,
    });
  }

  return NextResponse.json({
    ...payment,
    user,
    account: account ? { ...account, service } : null,
    qrUrl,
    bankInfo: {
      bankId: settings.bankId,
      accountNo: settings.accountNo,
      accountName: settings.accountName,
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.status) updateData.status = body.status;
  if (body.note !== undefined) updateData.note = body.note;
  if (body.status === "paid") updateData.paidAt = new Date().toISOString();

  const updated = await paymentsDB.update(id, updateData);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await paymentsDB.delete(id);
  return NextResponse.json({ ok: true });
}
