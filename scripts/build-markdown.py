#!/usr/bin/env python3
"""Generate the Markdown twins of the site pages (index.md, faq.md, privacy.md, terms.md).

Served to agents that send `Accept: text/markdown` (see netlify/edge-functions/markdown.ts).
Run from the repo root after changing page content:  python3 scripts/build-markdown.py
"""
import json, re, html
from html.parser import HTMLParser

BASE = "https://doramabir.com"


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.rstrip() + "\n")


class MainToMd(HTMLParser):
    """Tiny HTML -> Markdown converter for the <main> block of simple pages."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.in_main, self.skip = [], False, 0
        self.href = None
        self.list_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "main":
            self.in_main = True
            return
        if not self.in_main:
            return
        if tag in ("script", "style", "svg", "button"):
            self.skip += 1
        elif tag == "h1": self.out.append("\n\n# ")
        elif tag == "h2": self.out.append("\n\n## ")
        elif tag == "h3": self.out.append("\n\n### ")
        elif tag == "p": self.out.append("\n\n")
        elif tag == "ul": self.out.append("\n"); self.list_depth += 1
        elif tag == "li": self.out.append("\n- ")
        elif tag in ("strong", "b"): self.out.append("**")
        elif tag == "br": self.out.append("  \n")
        elif tag == "a" and a.get("href"):
            self.href = a["href"]; self.out.append("[")

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_main = False
            return
        if not self.in_main:
            return
        if tag in ("script", "style", "svg", "button"):
            self.skip = max(0, self.skip - 1)
        elif tag in ("strong", "b"): self.out.append("**")
        elif tag == "ul": self.list_depth -= 1; self.out.append("\n")
        elif tag == "a" and self.href:
            href = self.href
            if href.startswith(("#", "/")) is False and "://" not in href and not href.startswith(("mailto:", "tel:")):
                href = f"{BASE}/{href}"
            elif href.startswith("/"):
                href = BASE + href
            self.out.append(f"]({href})"); self.href = None

    def handle_data(self, data):
        if self.in_main and not self.skip:
            self.out.append(re.sub(r"\s+", " ", data))

    def markdown(self):
        text = "".join(self.out)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


def page_from_main(path, url, summary):
    parser = MainToMd()
    parser.feed(read(path))
    body = parser.markdown()
    return f"<!-- Markdown version of {url} for AI agents -->\n\n{body}\n\n---\nמקור: {url}\nסיכום: {summary}\n"


def build_faq():
    src = read("faq.html")
    m = re.search(r'<script type="application/ld\+json">\s*(\{[^<]*"FAQPage"[^<]*\})\s*</script>', src, re.S)
    data = json.loads(m.group(1))
    lines = ["# שאלות ותשובות: השקעות נדל\"ן בבוקרשט ורומניה | דורעם אביר", "",
             "תשובות לשאלות נפוצות של משקיעים ישראלים על רכישת דירה להשקעה בבוקרשט, רומניה.", ""]
    for q in data["mainEntity"]:
        lines += [f"## {q['name']}", "", q["acceptedAnswer"]["text"], ""]
    lines += ["---", f"מקור: {BASE}/faq.html",
              f"לתיאום שיחת היכרות: [WhatsApp](https://wa.me/972503322700) | bucuresti.doram@gmail.com"]
    return "\n".join(lines)


def build_index():
    c = json.loads(read("data/content-defaults.json"))
    L = []
    L += ['# דורעם אביר | ליווי השקעות נדל"ן בבוקרשט', "",
          "> " + c["hero_subtitle"], "",
          f"**{c['hero_title_line1']} — {c['hero_title_line2']}**", "",
          "## קצת עליי", "", c["about_paragraph1"], "", c["about_paragraph2"], "",
          f"{c['about_signature_name']} — {c['about_signature_role']}", "",
          "## מה כולל הליווי", ""]
    for i in range(1, 7):
        L.append(f"- **{c[f'benefit_{i}_title']}**: {c[f'benefit_{i}_desc']}")
    L += ["", "## " + c["why_bucharest_heading"], "", c["why_bucharest_paragraph"], "",
          "## תהליך הליווי — שישה שלבים", ""]
    for i in range(1, 7):
        L.append(f"{i}. " + c[f"process_{i}"].replace("\n", " "))
    L += ["", "## " + c["who_for_heading"], ""]
    src = read("index.html")
    sec = re.search(r'<section class="who-for".*?</section>', src, re.S).group(0)
    paras = [html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in re.findall(r"<p[^>]*>(.*?)</p>", sec, re.S)]
    items = [html.unescape(re.sub(r"<svg.*?</svg>|<[^>]+>", "", li, flags=re.S)).strip() for li in re.findall(r"<li[^>]*>(.*?)</li>", sec, re.S)]
    L += [p for p in paras if p] + [""] + [f"- {i}" for i in items if i]
    L += ["", "## לקוחות ממליצים", ""]
    for i in range(1, 6):
        q = c.get(f"testimonial_{i}_quote"); n = c.get(f"testimonial_{i}_name")
        if q: L += [f"> {q}", f"> — {n}", ""]
    L += ["## יצירת קשר", "",
          f"- טלפון / WhatsApp: {c['contact_phone_display']} ({c['contact_phone_href'].replace('tel:', '')})",
          f"- אימייל: {c['contact_email']}",
          "- אזורי פעילות: בוקרשט, רומניה, ישראל", "",
          "## עמודים נוספים", "",
          f"- [שאלות ותשובות]({BASE}/faq.html)",
          f"- [הצהרת נגישות ומדיניות פרטיות]({BASE}/privacy.html)",
          f"- [תקנון ומדיניות ביטולים]({BASE}/terms.html)",
          f"- [llms.txt]({BASE}/llms.txt)", "",
          "---", f"מקור: {BASE}/"]
    return "\n".join(L)


if __name__ == "__main__":
    write("index.md", build_index())
    write("faq.md", build_faq())
    write("privacy.md", page_from_main("privacy.html", f"{BASE}/privacy.html", "הצהרת נגישות ומדיניות פרטיות של אתר דורעם אביר."))
    write("terms.md", page_from_main("terms.html", f"{BASE}/terms.html", "תקנון האתר ומדיניות ביטולים."))
    print("markdown files written")
