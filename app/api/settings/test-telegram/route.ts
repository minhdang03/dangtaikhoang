import { NextResponse } from "next/server";
import { settingsDB } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST() {
  const settings = await settingsDB.get();
  if (!settings.telegramBotToken || !settings.telegramChatId) {
    return NextResponse.json({ error: "Chưa cấu hình Telegram Bot Token hoặc Chat ID" }, { status: 400 });
  }

  try {
    await sendTelegramMessage(
      settings.telegramBotToken,
      settings.telegramChatId,
      "🧪 <b>Test thành công!</b>\nBot đã kết nối với hệ thống."
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gửi tin nhắn thất bại, kiểm tra lại Bot Token và Chat ID" }, { status: 500 });
  }
}
