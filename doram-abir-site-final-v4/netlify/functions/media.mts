import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Public, read-only. Serves images uploaded through the admin panel.
export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(req.url);
  const key = decodeURIComponent(url.pathname.replace(/^\/api\/media\//, ""));
  if (!key) return new Response("Not Found", { status: 404 });

  const store = getStore("media");
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result || !result.data) return new Response("Not Found", { status: 404 });

  const contentType = (result.metadata && (result.metadata as any).contentType) || "application/octet-stream";
  return new Response(result.data as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
};

export const config: Config = {
  path: "/api/media/*"
};
