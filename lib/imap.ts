// Server-only: IMAP email fetcher for Netflix codes
// Port from netflixcode project (server-code.js, server-link.js, server-updatefam.js)
import Imap from "imap";

export type CodeType = "otp" | "link" | "updatefam";

export interface FetchedCode {
  type: CodeType;
  value: string; // the OTP code or URL
  date: string;  // vi-VN date string
}

// --- Helpers ---

function cleanLink(link: string): string {
  return link
    .replace(/=3D/g, "=")
    .replace(/=\r?\n/g, "")
    .replace(/&amp;/g, "&")
    .replace(/http=s:\/\//i, "https://")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, "")
    .trim();
}

function decodeQP(str: string): string {
  return str
    .replace(/=\r?\n/g, "")
    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractOTP(body: string): string | null {
  // Pattern 1: "7 5 1 7" — spaced digits
  const m1 = body.match(/\b(\d)\s+(\d)\s+(\d)\s+(\d)\b/);
  if (m1) return m1[1] + m1[2] + m1[3] + m1[4];

  // Pattern 2: Large font-size HTML element
  const m2 = body.match(/<(?:td|div|span)[^>]*style="[^"]*font-size:\s*(?:2[4-9]|[3-9]\d)\w+[^"]*"[^>]*>\s*(\d{4})\s*<\//i);
  if (m2) return m2[1];

  // Pattern 3: Vietnamese keyword before code
  const m3 = body.match(/(?:mã(?:\s+đăng\s+nhập)?|code)\s*(?:là|của bạn|:)?\s*(\d{4})/i);
  if (m3) return m3[1];

  // Pattern 4: Lone 4-digit in table cell
  const m4 = body.match(/<td[^>]*>\s*(\d{4})\s*<\/td>/i);
  if (m4) return m4[1];

  // Pattern 5: Fallback — any 4-digit sequence
  const m5 = body.match(/\b(\d{4})\b/);
  if (m5) return m5[1];

  return null;
}

function extractLink(body: string): string | null {
  const m = body.match(/href=3D"(http[^"]+)"/i) || body.match(/href="(http[^"]+)"/i);
  if (!m) return null;
  const link = cleanLink(m[1]);
  return link.includes("netflix.com/account/travel/verify") ? link : null;
}

function extractUpdateFam(body: string): string | null {
  body = decodeQP(body);

  const m = body.match(/(https:\/\/www\.netflix\.com\/account\/update-primary-location\?[^"\s<>]+)/i);
  if (!m) return null;

  let link = cleanLink(m[0])
    .replace(/=&g°/g, "=&g0")
    .replace(/&g\s*c/g, "&g=")
    .replace(/g°/g, "g0")
    .replace(/g³/g, "g=")
    .replace(/gc/g, "g=");

  const nftokenM = link.match(/nftoken=([^&\s]+)/);
  if (!nftokenM) return null;

  const gPatterns = [/[&?]g=([a-z0-9-]+)/i, /[&?]g°([a-z0-9-]+)/i, /[&?]gc([a-z0-9-]+)/i];
  let g: string | null = null;
  for (const pat of gPatterns) {
    const gm = body.match(pat);
    if (gm) { g = gm[1]; break; }
  }

  if (!g && !link.includes("&g=")) return null;
  return `https://www.netflix.com/account/update-primary-location?nftoken=${nftokenM[1]}&g=${g}`;
}

// --- IMAP search ---

interface SearchConfig {
  criteria: unknown[];
  maxAgeDays: number;
  extract: (body: string) => string | null;
  type: CodeType;
}

const SEARCH_CONFIGS: Record<CodeType, SearchConfig> = {
  otp: {
    criteria: [["SUBJECT", "Netflix: Mã đăng nhập của bạn"]],
    maxAgeDays: 30,
    extract: extractOTP,
    type: "otp",
  },
  link: {
    criteria: [["SUBJECT", "Mã truy cập Netflix"]],
    maxAgeDays: 7,
    extract: extractLink,
    type: "link",
  },
  updatefam: {
    criteria: [["OR", ["SUBJECT", "Hộ gia đình Netflix"], ["SUBJECT", "Cách cập nhật Hộ gia đình Netflix"]]],
    maxAgeDays: 7,
    extract: extractUpdateFam,
    type: "updatefam",
  },
};

export async function fetchCode(
  imapEmail: string,
  imapPassword: string,
  type: CodeType
): Promise<FetchedCode | null> {
  if (!imapEmail || !imapPassword) return null;

  const cfg = SEARCH_CONFIGS[type];
  const TIMEOUT = 30000;

  const connection = new Imap({
    user: imapEmail,
    password: imapPassword,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: TIMEOUT,
    connTimeout: TIMEOUT,
  });

  const timeoutPromise = new Promise<FetchedCode | null>((_, reject) =>
    setTimeout(() => reject(new Error("IMAP timeout")), TIMEOUT + 5000)
  );

  const workPromise = new Promise<FetchedCode | null>((resolve, reject) => {
    let settled = false;
    function done(val: FetchedCode | null) {
      if (settled) return;
      settled = true;
      try { connection.end(); } catch { /* ignore */ }
      resolve(val);
    }
    function fail(err: unknown) {
      if (settled) return;
      settled = true;
      try { connection.end(); } catch { /* ignore */ }
      reject(err);
    }

    connection.once("error", fail);
    connection.once("ready", () => {
      connection.openBox("INBOX", true, (err) => {
        if (err) return fail(err);

        const since = new Date();
        since.setDate(since.getDate() - cfg.maxAgeDays);
        const criteria = [...cfg.criteria, ["SINCE", since]];

        connection.search(criteria, (err2, ids) => {
          if (err2) return fail(err2);
          if (!ids || ids.length === 0) return done(null);

          // Only fetch the last 10 most recent emails
          const recentIds = ids.slice(-10);
          const results: FetchedCode[] = [];
          let processed = 0;

          const f = connection.fetch(recentIds, {
            bodies: ["HEADER.FIELDS (DATE)", "TEXT"],
          });

          f.on("message", (msg) => {
            let dateStr = "";
            let body = "";

            msg.on("body", (stream, info) => {
              let buf = "";
              stream.on("data", (chunk: Buffer) => { buf += chunk.toString("utf8"); });
              stream.once("end", () => {
                if (info.which.startsWith("HEADER")) {
                  const header = Imap.parseHeader(buf);
                  dateStr = header.date?.[0] ? new Date(header.date[0]).toLocaleString("vi-VN") : "";
                } else {
                  body = buf;
                }
              });
            });

            msg.once("end", () => {
              const value = cfg.extract(body);
              if (value) results.push({ type, value, date: dateStr });
              processed++;
              if (processed === recentIds.length) {
                // Return the latest result (last in sorted order)
                done(results.length > 0 ? results[results.length - 1] : null);
              }
            });
          });

          f.once("error", fail);
        });
      });
    });

    connection.connect();
  });

  return Promise.race([workPromise, timeoutPromise]);
}
