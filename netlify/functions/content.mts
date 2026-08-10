import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Public, read-only. Returns the currently published content overrides
// (only fields the admin has edited so far). Empty object means "use the
// static HTML as-is" -- the site works perfectly with no overrides at all.
export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const store = getStore("content");
  const data = await store.get("site.json", { type: "json" });
  return new Response(JSON.stringify(data || {}), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30"
    }
  });
};

export const config: Config = {
  path: "/api/content"
};
