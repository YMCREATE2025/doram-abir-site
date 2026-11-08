// Markdown content negotiation (https://acceptmarkdown.com) for the static site.
//
// - Requests that prefer `text/markdown` get the Markdown twin of the page
//   (index.md, faq.md, ...) with `Content-Type: text/markdown` and `Vary: Accept`.
// - Everything else is served unchanged (HTML) but gets `Vary: Accept` so caches
//   keep the two representations apart.
// - A missing path keeps its real 404 status; agents asking for Markdown get a
//   Markdown error body that points at llms.txt and the sitemap.

export const MARKDOWN_PAGES: Record<string, string> = {
  "/": "/index.md",
  "/index.html": "/index.md",
  "/faq": "/faq.md",
  "/faq.html": "/faq.md",
  "/privacy": "/privacy.md",
  "/privacy.html": "/privacy.md",
  "/terms": "/terms.md",
  "/terms.html": "/terms.md"
};

const SITE = "https://doramabir.com";

type Range = { type: string; q: number; specificity: number };

function parseAccept(header: string): Range[] {
  return header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [type, ...params] = part.split(";").map((s) => s.trim().toLowerCase());
      let q = 1;
      for (const p of params) {
        const m = /^q=([0-9.]+)$/.exec(p);
        if (m) q = Math.min(1, Math.max(0, parseFloat(m[1]) || 0));
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    });
}

function qualityFor(ranges: Range[], mime: string): { q: number; explicit: boolean } {
  const [major] = mime.split("/");
  let best: Range | null = null;
  for (const r of ranges) {
    const matches = r.type === mime || r.type === `${major}/*` || r.type === "*/*";
    if (matches && (!best || r.specificity > best.specificity)) best = r;
  }
  return { q: best ? best.q : 0, explicit: !!best && best.specificity === 2 };
}

/** True when the client asks for Markdown at least as strongly as it asks for HTML. */
export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader) return false;
  const ranges = parseAccept(acceptHeader);
  const md = qualityFor(ranges, "text/markdown");
  if (!md.explicit || md.q <= 0) return false;
  const html = qualityFor(ranges, "text/html");
  return md.q >= html.q;
}

export function notFoundMarkdown(pathname: string): string {
  return [
    "# 404 — הדף לא נמצא (Page not found)",
    "",
    `הכתובת \`${pathname.replace(/[`\r\n]/g, "")}\` לא קיימת באתר doramabir.com. ייתכן שהקישור שגוי או שהדף הוסר.`,
    "",
    `The page \`${pathname.replace(/[`\r\n]/g, "")}\` does not exist on doramabir.com.`,
    "",
    "## Where to go next",
    "",
    `- [llms.txt — site guide for agents](${SITE}/llms.txt)`,
    `- [Sitemap](${SITE}/sitemap.xml)`,
    `- [Home page (Markdown)](${SITE}/)`,
    `- [FAQ](${SITE}/faq.html)`,
    ""
  ].join("\n");
}

function withVary(res: Response): Response {
  const headers = new Headers(res.headers);
  const vary = headers.get("vary");
  if (!vary) headers.set("vary", "Accept");
  else if (!/(^|,)\s*accept\s*(,|$)/i.test(vary)) headers.set("vary", `${vary}, Accept`);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function markdownResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex"
    }
  });
}

type Ctx = {
  next: () => Promise<Response>;
  rewrite: (path: string) => Promise<Response>;
};

export async function handle(request: Request, context: Ctx): Promise<Response> {
  const url = new URL(request.url);
  const wantsMarkdown =
    (request.method === "GET" || request.method === "HEAD") && prefersMarkdown(request.headers.get("accept"));

  const mdPath = MARKDOWN_PAGES[url.pathname];
  if (wantsMarkdown && mdPath) {
    const twin = await context.rewrite(mdPath);
    if (twin.status === 200) {
      return markdownResponse(request.method === "HEAD" ? "" : await twin.text(), 200);
    }
  }

  const res = await context.next();

  if (wantsMarkdown && res.status === 404) {
    return markdownResponse(request.method === "HEAD" ? "" : notFoundMarkdown(url.pathname), 404);
  }
  return withVary(res);
}

export default handle;
