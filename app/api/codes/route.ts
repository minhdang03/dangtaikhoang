import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsDB } from "@/lib/db";
import { fetchCode, CodeType } from "@/lib/imap";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") as CodeType | null;
  if (!type || !["otp", "link", "updatefam"].includes(type)) {
    return NextResponse.json({ error: "type phải là otp | link | updatefam" }, { status: 400 });
  }

  const accountId = req.nextUrl.searchParams.get("accountId")?.trim();

  let imapEmail: string;
  let imapPassword: string;

  if (accountId) {
    // Use account-specific IMAP
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
    imapEmail = account.imapEmail;
    imapPassword = account.imapPassword;
  } else {
    // Fallback to global settings
    const settings = await settingsDB.get();
    imapEmail = settings.imapEmail;
    imapPassword = settings.imapPassword;
  }

  if (!imapEmail || !imapPassword) {
    return NextResponse.json({ error: "Chưa cấu hình Gmail IMAP" }, { status: 422 });
  }

  try {
    const result = await fetchCode(imapEmail, imapPassword, type);
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi kết nối";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
