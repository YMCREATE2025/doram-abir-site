import type { Context, Config } from "@netlify/functions";
import { passwordMatches, createSession, isLocked, recordFail, clearFails, SESSION_HOURS } from "../lib/auth.mts";

function reply(data: unknown, status: number, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...(headers || {}) }
  });
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return reply({ ok: false, error: "בקשה לא תקינה" }, 400);
  }

  const ip = (context as any).ip as string | undefined;

  if (await isLocked(req, ip)) {
    return reply({ ok: false, error: "יותר מדי ניסיונות. נסו שוב בעוד 15 דקות." }, 429);
  }

  const provided = typeof body?.password === "string" ? body.password.slice(0, 200) : "";

  if (!(await passwordMatches(provided))) {
    await recordFail(req, ip);
    await new Promise((r) => setTimeout(r, 400));
    return reply({ ok: false, error: "סיסמה שגויה" }, 401);
  }

  await clearFails(req, ip);
  const token = await createSession();
  const cookie = `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
  return reply({ ok: true }, 200, { "Set-Cookie": cookie });
};

export const config: Config = {
  path: "/api/admin/login"
};
