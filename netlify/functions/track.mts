import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

function deviceType(ua: string): string {
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function browserName(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/fxios|firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "אחר";
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  return v.slice(0, max);
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && isFinite(v) ? v : undefined;
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  if (!body || typeof body.type !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  const ua = req.headers.get("user-agent") || "";
  const ts = num(body.ts) || Date.now();
  const date = new Date(ts).toISOString().slice(0, 10);
  const id = `${ts}-${Math.random().toString(36).slice(2, 9)}`;

  const record: Record<string, unknown> = {
    type: str(body.type, 40),
    ts,
    path: str(body.path, 200) || "",
    visitorId: str(body.visitorId, 80) || "",
    sessionId: str(body.sessionId, 80) || "",
    isNewVisitor: !!body.isNewVisitor,
    attribution: body.attribution && typeof body.attribution === "object" ? body.attribution : null,
    label: str(body.label, 120),
    section: str(body.section, 60),
    href: str(body.href, 300),
    depth: num(body.depth),
    xPct: num(body.xPct),
    yPct: num(body.yPct),
    tag: str(body.tag, 20),
    device: deviceType(ua),
    browser: browserName(ua),
    country: (context.geo && context.geo.country && (context.geo.country.code || context.geo.country.name)) || "לא ידוע"
  };

  const events = getStore("analytics-events");
  await events.setJSON(`events/${date}/${id}.json`, record);

  if (body.type === "lead") {
    const leads = getStore("leads");
    const leadId = `lead_${ts}_${Math.random().toString(36).slice(2, 8)}`;
    const lead = {
      id: leadId,
      ts,
      name: str(body.name, 100) || "",
      phone: str(body.phone, 40) || "",
      email: str(body.email, 120) || "",
      city: str(body.city, 80) || "",
      budget: str(body.budget, 80) || "",
      message: str(body.message, 500) || "",
      formId: str(body.formId, 60) || "",
      marketingConsent: !!body.marketingConsent,
      path: record.path,
      attribution: record.attribution,
      status: "new"
    };
    await leads.setJSON(`leads/${leadId}.json`, lead);
  }

  return new Response(null, { status: 204 });
};

export const config: Config = {
  path: "/api/track"
};
