import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { prefersMarkdown, handle, notFoundMarkdown } from "../netlify/lib/markdown-edge.ts";

const md = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

// ---- Accept header negotiation -------------------------------------------------
test("prefersMarkdown: explicit markdown wins", () => {
  assert.equal(prefersMarkdown("text/markdown"), true);
  assert.equal(prefersMarkdown("text/markdown, text/html;q=0.5"), true);
  assert.equal(prefersMarkdown("text/html;q=0.8, text/markdown;q=0.9"), true);
  assert.equal(prefersMarkdown("TEXT/Markdown; charset=utf-8"), true);
});

test("prefersMarkdown: browsers and curl defaults keep HTML", () => {
  assert.equal(prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"), false);
  assert.equal(prefersMarkdown("*/*"), false);
  assert.equal(prefersMarkdown("text/html"), false);
  assert.equal(prefersMarkdown(""), false);
  assert.equal(prefersMarkdown(null), false);
});

test("prefersMarkdown: HTML preferred or markdown refused", () => {
  assert.equal(prefersMarkdown("text/markdown;q=0"), false);
  assert.equal(prefersMarkdown("text/markdown;q=0.4, text/html"), false);
  assert.equal(prefersMarkdown("text/*"), false); // wildcard alone is not an explicit markdown request
});

// ---- Edge handler --------------------------------------------------------------
function fakeContext({ status = 200, files = {} } = {}) {
  return {
    next: async () => new Response(status === 404 ? "<h1>404</h1>" : "<html>home</html>", { status, headers: { "content-type": "text/html; charset=utf-8" } }),
    rewrite: async (path) => files[path] !== undefined
      ? new Response(files[path], { status: 200, headers: { "content-type": "text/plain" } })
      : new Response("nope", { status: 404 })
  };
}
const req = (path, accept, method = "GET") => new Request("https://doramabir.com" + path, { method, headers: accept ? { accept } : {} });
const files = { "/index.md": "# Home\n\nשלום", "/faq.md": "# FAQ\n" };

test("homepage + Accept: text/markdown -> markdown body, correct headers", async () => {
  const res = await handle(req("/", "text/markdown"), fakeContext({ files }));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/markdown/);
  assert.match(res.headers.get("vary"), /Accept/i);
  assert.equal(await res.text(), files["/index.md"]);
});

test("homepage + Accept: text/html -> HTML with Vary: Accept", async () => {
  const res = await handle(req("/", "text/html"), fakeContext({ files }));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/html/);
  assert.match(res.headers.get("vary"), /Accept/i);
  assert.match(await res.text(), /home/);
});

test("no Accept header (curl default) -> HTML", async () => {
  const res = await handle(req("/faq.html"), fakeContext({ files }));
  assert.match(res.headers.get("content-type"), /^text\/html/);
});

test("faq page maps to faq.md", async () => {
  const res = await handle(req("/faq.html", "text/markdown"), fakeContext({ files }));
  assert.equal(await res.text(), files["/faq.md"]);
});

test("Vary is appended, not overwritten", async () => {
  const ctx = { next: async () => new Response("x", { headers: { vary: "Accept-Encoding" } }), rewrite: async () => new Response("", { status: 404 }) };
  const res = await handle(req("/other", "text/html"), ctx);
  assert.equal(res.headers.get("vary"), "Accept-Encoding, Accept");
});

test("404 + markdown -> real 404 status with markdown body linking llms.txt and sitemap", async () => {
  const res = await handle(req("/__does-not-exist", "text/markdown"), fakeContext({ status: 404 }));
  assert.equal(res.status, 404);
  assert.match(res.headers.get("content-type"), /^text\/markdown/);
  assert.match(res.headers.get("vary"), /Accept/i);
  const body = await res.text();
  assert.ok(body.length >= 20);
  assert.match(body, /llms\.txt/);
  assert.match(body, /sitemap\.xml/);
});

test("404 + html -> stays HTML 404", async () => {
  const res = await handle(req("/__does-not-exist", "text/html"), fakeContext({ status: 404 }));
  assert.equal(res.status, 404);
  assert.match(res.headers.get("content-type"), /^text\/html/);
});

test("HEAD requests return headers without a body", async () => {
  const res = await handle(req("/", "text/markdown", "HEAD"), fakeContext({ files }));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/markdown/);
  assert.equal(await res.text(), "");
});

test("notFoundMarkdown escapes the path", () => {
  assert.ok(!notFoundMarkdown("/a`b\nc").includes("`b"));
});

// ---- Static artifacts ----------------------------------------------------------
test("markdown twins exist and are non-trivial", () => {
  for (const f of ["index.md", "faq.md", "privacy.md", "terms.md"]) {
    assert.ok(existsSync(new URL("../" + f, import.meta.url)), f);
    assert.ok(md(f).length > 500, f + " too short");
    assert.ok(md(f).startsWith("<!--") || md(f).startsWith("#"), f + " should start with a heading or comment");
  }
  assert.match(md("index.md"), /בוקרשט/);
  assert.match(md("faq.md"), /^## /m);
});

test("llms.txt has a when-to-use section and links to markdown + sitemap", () => {
  const t = md("llms.txt");
  assert.match(t, /^## מתי להשתמש/m);
  assert.match(t, /When to use/i);
  assert.match(t, /https:\/\/doramabir\.com\/index\.md/);
  assert.match(t, /sitemap\.xml/);
  assert.ok(!t.includes("www.doramabir.com"));
});

test("404.html exists and links to llms.txt and sitemap", () => {
  const t = md("404.html");
  assert.match(t, /llms\.txt/);
  assert.match(t, /sitemap\.xml/);
});

test("canonical/sitemap/robots use the primary (apex) domain", () => {
  for (const f of ["index.html", "faq.html", "privacy.html", "terms.html", "sitemap.xml", "robots.txt"]) {
    assert.ok(!md(f).includes("www.doramabir.com"), f + " still references www");
  }
});

test("JSON-LD on the homepage: Person and RealEstateAgent have descriptions", () => {
  const html = md("index.html");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/g)].map((m) => JSON.parse(m[1]));
  const person = blocks.find((b) => b["@type"] === "Person");
  const biz = blocks.find((b) => b["@type"] === "RealEstateAgent");
  assert.ok(person && person.description.length > 40);
  assert.ok(biz && biz.description.length > 40);
  assert.ok(biz.serviceType && biz.keywords && biz.knowsAbout.length);
  assert.match(html, /<meta name="keywords"/);
});

test("netlify.toml keeps publish/functions and serves .md with the right type", () => {
  const t = md("netlify.toml");
  assert.match(t, /functions = "netlify\/functions"/);
  assert.match(t, /text\/markdown/);
});

test("edge function config excludes assets and API", () => {
  const t = md("netlify/edge-functions/markdown.ts");
  assert.match(t, /path: "\/\*"/);
  assert.match(t, /\/api\/\*/);
});

test("netlify.toml blocks static access to source folders", () => {
  const t = md("netlify.toml");
  for (const p of ["/netlify/*", "/scripts/*", "/test/*"]) assert.ok(t.includes(`from = "${p}"`), p);
});
