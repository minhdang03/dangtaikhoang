import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsDB } from "@/lib/db";
import { confirmOrder } from "@/lib/order-helpers";
import { answerCallbackQuery, editMessageText } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const callback = body.callback_query;
  if (!callback?.data) return NextResponse.json({ ok: true });

  const settings = await settingsDB.get();
  const { data } = callback;

  if (data.startsWith("approve_")) {
    const orderId = data.replace("approve_", "");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { account: { include: { service: true } } },
    });

    if (!order || order.status !== "pending") {
      await answerCallbackQuery(settings.telegramBotToken, callback.id, "Đơn hàng không tồn tại hoặc đã xử lý");
      return NextResponse.json({ ok: true });
    }

    await confirmOrder(order);
    await answerCallbackQuery(settings.telegramBotToken, callback.id, "Đã duyệt đơn hàng!");

    const originalText = callback.message?.text || "";
    await editMessageText(
      settings.telegramBotToken,
      callback.message.chat.id,
      callback.message.message_id,
      `✅ <b>Đã duyệt</b>\n\n${originalText}`
    );
  } else if (data.startsWith("reject_")) {
    const orderId = data.replace("reject_", "");
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.status !== "pending") {
      await answerCallbackQuery(settings.telegramBotToken, callback.id, "Đơn hàng không tồn tại hoặc đã xử lý");
      return NextResponse.json({ ok: true });
    }

    await prisma.order.update({ where: { id: orderId }, data: { status: "expired" } });
    await answerCallbackQuery(settings.telegramBotToken, callback.id, "Đã từ chối đơn hàng");

    const originalText = callback.message?.text || "";
    await editMessageText(
      settings.telegramBotToken,
      callback.message.chat.id,
      callback.message.message_id,
      `❌ <b>Đã từ chối</b>\n\n${originalText}`
    );
  }

  return NextResponse.json({ ok: true });
}
