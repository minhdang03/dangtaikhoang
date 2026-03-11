const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendTelegramMessage(botToken: string, chatId: string, text: string, replyMarkup?: object) {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
}

export async function answerCallbackQuery(botToken: string, callbackQueryId: string, text: string) {
  await fetch(`${TELEGRAM_API}${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function editMessageText(botToken: string, chatId: string, messageId: number, text: string) {
  await fetch(`${TELEGRAM_API}${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  });
}

export function buildOrderNotification(order: {
  id: string;
  customerPhone: string;
  customerName: string;
  serviceName: string;
  duration: number;
  amount: number;
  promoCode?: string;
}) {
  const lines = [
    "🛒 <b>Đơn hàng mới!</b>",
    "",
    `📱 SĐT: <code>${order.customerPhone}</code>`,
    order.customerName ? `👤 Tên: ${order.customerName}` : null,
    `📦 Dịch vụ: ${order.serviceName}`,
    `⏰ Thời hạn: ${order.duration} tháng`,
    `💰 Số tiền: ${order.amount.toLocaleString("vi-VN")}₫`,
    order.promoCode ? `🎟️ Mã giảm giá: ${order.promoCode}` : null,
    "",
    `🆔 Mã đơn: <code>${order.id.slice(0, 8)}</code>`,
  ].filter(line => line !== null);

  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Duyệt", callback_data: `approve_${order.id}` },
      { text: "❌ Từ chối", callback_data: `reject_${order.id}` },
    ]],
  };

  return { text: lines.join("\n"), replyMarkup };
}
