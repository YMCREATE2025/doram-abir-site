import { getStore } from "@netlify/blobs";

// SHA-256 of the default admin password. The plaintext is not stored in code.
// To override without touching code: set ADMIN_PASSWORD in Netlify env vars.
const DEFAULT_PASSWORD_HASH = "2d7a3b923304ef07c0a8ca39255ab78e9d123b4f7e9bcc68433f3efe1a674b8e";

export const SESSION_HOURS = 12;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function passwordMatches(provided: string): Promise<boolean> {
  if (!provided) return false;
  const envPw = (typeof Netlify !== "undefined" && Netlify.env.get("ADMIN_PASSWORD")) || "";
  if (envPw) return provided === envPw;
  return (await sha256(provided)) === DEFAULT_PASSWORD_HASH;
}

export function getCookie(req: Request, name: string): string {
  const header = req.headers.get("cookie") || "";
  const found = header.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + "="));
  return found ? found.slice(name.length + 1) : "";
}

export async function createSession(): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const store = getStore("admin-sessions");
  await store.setJSON(token, { expiry: Date.now() + SESSION_HOURS * 3600 * 1000 });
  return token;
}

export async function isAuthed(req: Request): Promise<boolean> {
  const token = getCookie(req, "admin_session");
  if (!token || !/^[a-zA-Z0-9-]{40,80}$/.test(token)) return false;
  try {
    const store = getStore("admin-sessions");
    const s: any = await store.get(token, { type: "json" });
    if (!s || !s.expiry || Date.now() > s.expiry) {
      if (s) await store.delete(token);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function destroySession(req: Request): Promise<void> {
  const token = getCookie(req, "admin_session");
  if (!token || !/^[a-zA-Z0-9-]{40,80}$/.test(token)) return;
  try { await getStore("admin-sessions").delete(token); } catch { /* ignore */ }
}

function ipOf(req: Request, ctxIp?: string): string {
  return (ctxIp || req.headers.get("x-nf-client-connection-ip") || "unknown").replace(/[^a-zA-Z0-9:.]/g, "_");
}

export async function isLocked(req: Request, ctxIp?: string): Promise<boolean> {
  try {
    const rec: any = await getStore("admin-attempts").get(ipOf(req, ctxIp), { type: "json" });
    return !!(rec && rec.fails >= MAX_FAILS && Date.now() < rec.until);
  } catch { return false; }
}

export async function recordFail(req: Request, ctxIp?: string): Promise<void> {
  try {
    const store = getStore("admin-attempts");
    const key = ipOf(req, ctxIp);
    const rec: any = (await store.get(key, { type: "json" })) || { fails: 0 };
    const fresh = rec.until && Date.now() > rec.until ? { fails: 0 } : rec;
    const fails = (fresh.fails || 0) + 1;
    await store.setJSON(key, { fails, until: Date.now() + LOCK_MINUTES * 60 * 1000 });
  } catch { /* ignore */ }
}

export async function clearFails(req: Request, ctxIp?: string): Promise<void> {
  try { await getStore("admin-attempts").delete(ipOf(req, ctxIp)); } catch { /* ignore */ }
}
