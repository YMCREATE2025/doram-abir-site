import type { Context, Config } from "@netlify/functions";

async function hmac(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_HOURS = 12;

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "בקשה לא תקינה" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const ADMIN_PASSWORD = Netlify.env.get("ADMIN_PASSWORD") || "";
  const SECRET = Netlify.env.get("ADMIN_SESSION_SECRET") || "";

  const provided = typeof body?.password === "string" ? body.password : "";

  if (!ADMIN_PASSWORD || !SECRET || !provided || provided !== ADMIN_PASSWORD) {
    // small delay to slow down brute-force guessing
    await new Promise((r) => setTimeout(r, 350));
    const debug = `סיסמה שגויה [דיבוג: env=${ADMIN_PASSWORD.length},got=${provided.length},secret=${SECRET ? "yes" : "no"}]`;
    return new Response(JSON.stringify({ ok: false, error: debug }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const sig = await hmac(SECRET, String(expiry));
  const token = `${expiry}.${sig}`;
  const cookie = `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 60 * 60}`;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie
    }
  });
};

export const config: Config = {
  path: "/api/admin/login"
};
