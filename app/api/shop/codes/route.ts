import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsDB } from "@/lib/db";
import { fetchCode } from "@/lib/imap";

// Customer-facing: requires valid phone+pin, only returns OTP
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  const pin = req.nextUrl.searchParams.get("pin")?.trim();

  if (!phone || !pin) {
    return NextResponse.json({ error: "Thiếu thông tin xác thực" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user || !user.lookupPin || user.lookupPin !== pin) {
    return NextResponse.json({ error: "Xác thực thất bại" }, { status: 403 });
  }

  // Verify user has at least one active Netflix subscription
  const netflixSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "active" },
    include: { account: { include: { service: true } } },
  });

  if (!netflixSub || netflixSub.account.service.type !== "netflix") {
    return NextResponse.json({ error: "Không tìm thấy tài khoản Netflix" }, { status: 404 });
  }

  const settings = await settingsDB.get();
  if (!settings.imapEmail || !settings.imapPassword) {
    return NextResponse.json({ error: "Chưa cấu hình email. Liên hệ admin." }, { status: 422 });
  }

  try {
    const result = await fetchCode(settings.imapEmail, settings.imapPassword, "otp");
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi kết nối";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
