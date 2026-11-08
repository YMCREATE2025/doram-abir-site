import type { Config, Context } from "@netlify/edge-functions";
import { handle } from "../lib/markdown-edge.ts";

export default async (request: Request, context: Context) =>
  handle(request, {
    next: () => context.next(),
    rewrite: async (path: string) => context.rewrite(path)
  });

export const config: Config = {
  path: "/*",
  excludedPath: ["/css/*", "/js/*", "/assets/*", "/data/*", "/api/*", "/admin/*", "/.netlify/*", "/*.md"]
};
