import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { settingsDB } from "@/lib/db";
import { fetchCode, CodeType } from "@/lib/imap";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") as CodeType | null;
  if (!type || !["otp", "link", "updatefam"].includes(type)) {
    return NextResponse.json({ error: "type phải là otp | link | updatefam" }, { status: 400 });
  }

  const settings = await settingsDB.get();
  if (!settings.imapEmail || !settings.imapPassword) {
    return NextResponse.json({ error: "Chưa cấu hình Gmail IMAP trong Cài đặt" }, { status: 422 });
  }

  try {
    const result = await fetchCode(settings.imapEmail, settings.imapPassword, type);
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi kết nối";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
