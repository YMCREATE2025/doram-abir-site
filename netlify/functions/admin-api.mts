import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { isAuthed, destroySession, passwordMatches, createSession, isLocked, recordFail, clearFails, SESSION_HOURS } from "../lib/auth.mts";

const DEFAULT_CONTENT: Record<string, string> = {
  "hero_title_line1": "דירה להשקעה בבוקרשט",
  "hero_title_line2": "בביטחון ובשקיפות מלאה",
  "hero_subtitle": "ליווי אישי למשקיעים ישראלים בשיטת יד ביד, משלב בחירת הנכס והיכרות עם היזמים ועד לריהוט, השכרה וניהול שוטף.",
  "hero_portrait_img": "https://static.wixstatic.com/media/a6dc54_7cf86a071124478fa537bcec7324d12e~mv2.jpeg/v1/fill/w_760,h_1000,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/doram.jpg",
  "about_paragraph1": "שמי דורעם אביר, יועץ נדל\"ן ומלווה אישי למשקיעים ישראלים בבוקרשט. אחרי 24 שנים כקצין בצה\"ל וכאחד ממקימי השיטור העירוני בתל אביב, בחרתי להפוך את הניסיון, הערכים והדיוק המקצועי שלי למסלול בטוח וברור עבור משקיעים המבקשים לרכוש דירה בעיר הצומחת ביותר במזרח אירופה.",
  "about_paragraph2": "את תחום הנדל\"ן בבוקרשט אני חי ונושם מזה שנים, מכיר את השוק המקומי לעומק, עובד מול יזמים גדולים ומוכרים, ומלווה את לקוחותיי באופן אישי בכל שלב. מהבנת הצרכים והתקציב, דרך סיור מקצועי בנכסים, פתיחת חשבון בנק, חתימות אצל נוטריון ורכישת נכס מתאים, ועד לריהוט, השכרה וניהול שוטף. אני מאמין בשקיפות מלאה, אחריות, ויצירת תהליך רגוע ובטוח לכל משקיע שמבקש להפוך את בוקרשט להזדמנות הנכונה עבורו.",
  "about_photo_img": "assets/img/doram-reading-v2.png",
  "about_signature_name": "דורעם אביר",
  "about_signature_role": "יועץ נדל\"ן ומלווה אישי למשקיעים ישראלים בבוקרשט",
  "benefit_1_title": "בחירת פרויקטים ויזמים",
  "benefit_1_desc": "בדיקה והתאמה של נכסים מול יזמים מוכרים ובהתאם לצרכים ולתקציב.",
  "benefit_2_title": "היכרות עם השוק המקומי",
  "benefit_2_desc": "ידע מעמיק בבוקרשט, בשכונות המתפתחות ובתרבות העסקית הרומנית.",
  "benefit_3_title": "סיור נכסים מקצועי",
  "benefit_3_desc": "תכנון סיור ממוקד בין הפרויקטים הרלוונטיים, בלי לבזבז זמן.",
  "benefit_4_title": "ליווי משפטי ובנקאי",
  "benefit_4_desc": "סיוע בתהליך פתיחת חשבון בנק, עבודה מול עורכי דין וחתימה אצל נוטריון.",
  "benefit_5_title": "ריהוט והשכרת הנכס",
  "benefit_5_desc": "ליווי גם לאחר הרכישה, כולל ריהוט, הכנת הדירה להשכרה ומציאת שוכרים.",
  "benefit_6_title": "ניהול ומכירה",
  "benefit_6_desc": "פתרון המשכי לניהול הנכס ולמכירתו בעת הצורך.",
  "why_bucharest_heading": "למה משקיעים ישראלים בוחרים דווקא בבוקרשט?",
  "why_bucharest_paragraph": "בוקרשט נמצאת בתנופת פיתוח משמעותית, עם השקעות בתשתיות, שכונות חדשות ומתחמי מגורים מודרניים. מחירי הנכסים עדיין נגישים ביחס לערי בירה אחרות באירופה, והביקוש למגורים באזורים המתפתחים ממשיך לעלות.",
  "why_bucharest_bg_img": "assets/img/bucharest-street-sunset.jpg",
  "process_1": "שיחת היכרות\nוהגדרת מטרות",
  "process_2": "התאמת תקציב\nוסוג הנכס",
  "process_3": "בחירת פרויקטים\nויזמים",
  "process_4": "סיור מקצועי\nבבוקרשט",
  "process_5": "משא ומתן, בנק\nחוזה ונוטריון",
  "process_6": "ריהוט, השכרה\nוניהול",
  "who_for_heading": "למי הליווי שלי מתאים?",
  "who_for_photo_img": "assets/img/doram-park.png",
  "testimonial_1_quote": "לאחר מספר פגישות פגשנו את דורעם, והחיבור היה מיידי. הוא לא קובע פגישות אחרי השעה 13:00 בגלל הילדים שלו – לא בדיוק מה שמצפים מאיש מכירות, וזו הנקודה שתפסה אותנו. במעבר מדוקדק על הרצונות שלנו והתכניות לעתיד, בנינו יחד תכנית עבודה למיצוי הטוב ביותר של ההשקעה. לאחר בחירת כיוון כבר נפגשנו בבוקרשט: פתחנו חשבון בנק, סיירנו בכמה פרויקטים, והכל התנהל בפשטות בזכות ההכנה המוקדמת והליווי שלו ושל הצוות. כבר במהלך המשא ומתן, דורעם חסך לנו יותר מהעמלה ששילמנו על שירותיו. בהמשך, נסיעה נוספת שתוכננה התבטלה עקב גל ביטולי טיסות, ודורעם היה איתנו יומיים ברצף מול היזם ועורכי הדין בטלפון כדי להסדיר את העניין מרחוק.",
  "testimonial_1_name": "ניצן לביא",
  "testimonial_2_quote": "דורעם הוא אחד יחיד ומיוחד. תמיד מסביר פנים, אמין ומקצועי. יודע להיות חבר אמיתי. זכינו בו.",
  "testimonial_2_name": "אהובה היט",
  "testimonial_3_quote": "מה שקנה אותי אצל דורעם זה השירות המקיף – גם מקצועיות וגם ליווי אישי. לא חיפשתי להתעסק עם שוכרים או שלט רחוק, ודורעם דאג להכל: מאיתור הנכס ועד הניהול השוטף. זה פשוט תענוג לדעת שיש מישהו שדואג שהנכס יהיה מושכר ומטופל, בזמן שאני בארץ בלי כאבי ראש. למי שמחפש השקעה פסיבית באמת – הוא הכתובת. נרכוש שוב דרך דורעם.",
  "testimonial_3_name": "רותם ואיתן ג', תל אביב",
  "testimonial_4_quote": "בעולם הנדל\"ן היום קשה למצוא אנשים ישרים, ביחוד בהשקעות בנכסים בחו\"ל ובוודאי בבוקרשט. דורעם הוא נכס בפני עצמו: מהרגע הראשון הוא היה שקוף איתי לגבי הסיכונים והסיכויים, בלי הבטחות שווא. הכל היה על השולחן. היושרה שלו וההדיבור בגובה העיניים נתנו לי את האמון לעשות את הצעד. כיף לעשות עסקים עם אדם שאפשר לסמוך עליו במאה אחוז.",
  "testimonial_4_name": "רינה ומשה פ', קיסריה",
  "testimonial_5_quote": "בסופו של דבר המבחן הוא בתוצאה, ודורעם סיפק את הסחורה. העסקה שתפר לי בבוקרשט הוכיחה את עצמה מעל המצופה, גם בעליית הערך וגם בשכירות השוטפת. יש לו חושים חדים לעסקאות טובות והוא יודע לזהות פוטנציאל איפה שאחרים מפספסים. מי שרוצה שהכסף שלו יעבוד חכם, כדאי לו מאוד להקשיב למה שיש לדורעם להציע.",
  "testimonial_5_name": "לקוח מרוצה",
  "reel_1_href": "https://www.instagram.com/reel/DXMZmsgjHKq/?utm_source=ig_web_copy_link",
  "reel_1_img": "assets/img/reel-preview-6.jpg",
  "reel_2_href": "https://www.instagram.com/reel/DbBNekGMWBb/?utm_source=ig_web_copy_link",
  "reel_2_img": "assets/img/reel-preview-5.jpg",
  "reel_3_href": "https://www.instagram.com/reel/DWlpnUYjEWT/?utm_source=ig_web_copy_link",
  "reel_3_img": "assets/img/reel-preview-4.jpg",
  "reel_4_href": "https://www.instagram.com/reel/DWWdVNMDM_M/?utm_source=ig_web_copy_link",
  "reel_4_img": "assets/img/reel-preview-3.jpg",
  "reel_5_href": "https://www.instagram.com/reel/DV3hGl_jGdY/?utm_source=ig_web_copy_link",
  "reel_5_img": "assets/img/reel-preview-2.jpg",
  "reel_6_href": "https://www.instagram.com/reel/DPyxzNVjP6l/?utm_source=ig_web_copy_link",
  "reel_6_img": "assets/img/reel-preview-1.jpg",
  "contact_phone_display": "050-3322700",
  "contact_phone_href": "tel:+972503322700",
  "contact_email": "bucuresti.doram@gmail.com",
  "footer_tagline": "ייעוץ וליווי אישי למשקיעים ישראלים ברכישת דירה להשקעה בבוקרשט — מהבחירה ועד לניהול הנכס."
};

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders || {}) }
  });
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const lines = [cols.map(esc).join(",")];
  rows.forEach((r) => lines.push(cols.map((c) => esc(r[c])).join(",")));
  return "﻿" + lines.join("\r\n");
}

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const LAUNCH_DATE = "2026-08-09";

const SRC_LABELS: Record<string, string> = {
  direct: "ישירה",
  organic: "חיפוש אורגני",
  social: "רשתות חברתיות",
  referral: "הפניה מאתר אחר",
  internal: "פנימי"
};

function pageLabel(path: string): string {
  const p = (path || "").split("?")[0].split("#")[0];
  if (p === "" || p === "/" || p === "/index.html") return "עמוד הבית";
  if (p.indexOf("faq") !== -1) return "שאלות ותשובות";
  if (p.indexOf("privacy") !== -1) return "מדיניות פרטיות ונגישות";
  return p || "עמוד הבית";
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const action = url.pathname.replace(/^\/api\/admin\/?/, "").split("/")[0] || "";

  if (action === "login" && req.method === "POST") {
    const ip = (context as any).ip as string | undefined;
    if (await isLocked(req, ip)) {
      return json({ ok: false, error: "יותר מדי ניסיונות. נסו שוב בעוד 15 דקות." }, 429);
    }
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const provided = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
    if (!(await passwordMatches(provided))) {
      await recordFail(req, ip);
      await new Promise((r) => setTimeout(r, 400));
      return json({ ok: false, error: "סיסמה שגויה" }, 401);
    }
    await clearFails(req, ip);
    const token = await createSession();
    return json({ ok: true }, 200, {
      "Set-Cookie": `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`
    });
  }

  if (action === "logout") {
    await destroySession(req);
    return json(
      { ok: true },
      200,
      { "Set-Cookie": "admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" }
    );
  }

  if (action === "check") {
    return (await isAuthed(req)) ? json({ ok: true }) : json({ ok: false }, 401);
  }

  if (!(await isAuthed(req))) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  // ---------- stats ----------
  if (action === "stats" && req.method === "GET") {
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") || "7")));
    const store = getStore("analytics-events");

    function datesFor(endOffsetDays: number, count: number): string[] {
      const now = new Date();
      const list: string[] = [];
      for (let i = 0; i < count; i++) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - endOffsetDays - i);
        list.push(d.toISOString().slice(0, 10));
      }
      return list;
    }

    async function loadEvents(dates: string[]): Promise<any[]> {
      let all: any[] = [];
      for (const date of dates) {
        const { blobs } = await store.list({ prefix: `events/${date}/` });
        if (!blobs.length) continue;
        const chunk = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
        all = all.concat(chunk.filter(Boolean));
      }
      return all;
    }

    const dateList = datesFor(0, days);
    const prevDateList = datesFor(days, days);

    const launch = new Date(LAUNCH_DATE + "T00:00:00Z");
    const allTimeDaysRaw = Math.floor((Date.now() - launch.getTime()) / 86400000) + 1;
    const allTimeDays = Math.min(370, Math.max(1, allTimeDaysRaw));

    const allEvents = await loadEvents(dateList);
    const prevEvents = await loadEvents(prevDateList);
    const allTimeEvents = allTimeDays <= days ? allEvents : await loadEvents(datesFor(0, allTimeDays));

    const visitors = new Set<string>();
    const newVisitors = new Set<string>();
    const sessions = new Set<string>();
    const sources: Record<string, number> = {};
    const buttons: Record<string, number> = {};
    const reels: Record<string, number> = {};
    const scrollBuckets: Record<string, number> = { "25": 0, "50": 0, "75": 0, "100": 0 };
    const clickPoints: { x: number; y: number; path: string }[] = [];
    const byDate: Record<string, { pageviews: number; visitors: Set<string> }> = {};
    const topPages: Record<string, number> = {};
    const geo: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    let pageviews = 0,
      whatsapp = 0,
      phone = 0,
      forms = 0,
      instagram = 0;

    for (const ev of allEvents) {
      if (!ev) continue;
      const d = new Date(ev.ts).toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { pageviews: 0, visitors: new Set() };
      if (ev.visitorId) {
        visitors.add(ev.visitorId);
        byDate[d].visitors.add(ev.visitorId);
      }
      if (ev.sessionId) sessions.add(ev.sessionId);
      if (ev.isNewVisitor && ev.visitorId) newVisitors.add(ev.visitorId);

      const src = (ev.attribution && ev.attribution.firstTouch && ev.attribution.firstTouch.source) || "direct";

      if (ev.type === "pageview") {
        pageviews++;
        byDate[d].pageviews++;
        sources[src] = (sources[src] || 0) + 1;
        const pg = pageLabel(ev.path);
        topPages[pg] = (topPages[pg] || 0) + 1;
        const country = ev.country || "לא ידוע";
        geo[country] = (geo[country] || 0) + 1;
        if (ev.device) deviceCounts[ev.device] = (deviceCounts[ev.device] || 0) + 1;
        if (ev.browser) browserCounts[ev.browser] = (browserCounts[ev.browser] || 0) + 1;
      }
      if (ev.type === "whatsapp_click") whatsapp++;
      if (ev.type === "phone_click") phone++;
      if (ev.type === "lead") forms++;
      if (ev.type === "instagram_click") instagram++;
      if (ev.type === "button_click" || ev.type === "whatsapp_click") {
        const key = `${ev.section || ""} / ${ev.label || ev.href || ""}`;
        buttons[key] = (buttons[key] || 0) + 1;
      }
      if (ev.type === "reel_click") {
        const key = ev.href || ev.label || "reel";
        reels[key] = (reels[key] || 0) + 1;
      }
      if (ev.type === "scroll_depth" && ev.depth) {
        scrollBuckets[String(ev.depth)] = (scrollBuckets[String(ev.depth)] || 0) + 1;
      }
      if (ev.type === "click_point" && typeof ev.xPct === "number") {
        clickPoints.push({ x: ev.xPct, y: ev.yPct, path: ev.path });
      }
    }

    const dailyTrend = dateList
      .slice()
      .reverse()
      .map((d) => ({
        date: d,
        pageviews: byDate[d] ? byDate[d].pageviews : 0,
        visitors: byDate[d] ? byDate[d].visitors.size : 0
      }));

    // bucket the trend into at most 20 groups for readability on long ranges
    const bucketSize = Math.max(1, Math.ceil(dailyTrend.length / 20));
    const trend: { date: string; pageviews: number; visitors: number }[] = [];
    for (let i = 0; i < dailyTrend.length; i += bucketSize) {
      const chunk = dailyTrend.slice(i, i + bucketSize);
      const visitorUnion = new Set<string>();
      trend.push({
        date: bucketSize === 1 ? chunk[0].date : `${chunk[0].date} – ${chunk[chunk.length - 1].date}`,
        pageviews: chunk.reduce((a, c) => a + c.pageviews, 0),
        visitors: chunk.reduce((a, c) => a + c.visitors, 0)
      });
    }

    const conversions = forms + whatsapp;
    const conversionRate = pageviews > 0 ? Math.round((conversions / pageviews) * 1000) / 10 : 0;

    // ---- previous period + all-time basic totals ----
    function basicTotals(events: any[]) {
      let pv = 0;
      const vs = new Set<string>();
      for (const ev of events) {
        if (!ev) continue;
        if (ev.visitorId) vs.add(ev.visitorId);
        if (ev.type === "pageview") pv++;
      }
      return { pageviews: pv, visitors: vs.size };
    }
    const prevTotals = basicTotals(prevEvents);
    const allTimeTotals = basicTotals(allTimeEvents);

    // ---- insights ----
    const insights: { level: string; text: string }[] = [];

    if (prevTotals.pageviews === 0 && prevTotals.visitors === 0) {
      insights.push({
        level: "green",
        text: "אלה הכניסות הראשונות שנרשמו בטווח הזה — אין עדיין תקופה קודמת להשוואה."
      });
    } else if (prevTotals.pageviews > 0) {
      const deltaPct = Math.round(((pageviews - prevTotals.pageviews) / prevTotals.pageviews) * 1000) / 10;
      const dir = deltaPct >= 0 ? "גבוהות" : "נמוכות";
      insights.push({
        level: deltaPct >= 0 ? "green" : "orange",
        text: `כניסות בטווח הנוכחי ${dir} ב-${Math.abs(deltaPct)}% לעומת התקופה הקודמת באותו אורך.`
      });
    }

    if (sessions.size > 0) {
      const avgPages = Math.round((pageviews / sessions.size) * 10) / 10;
      insights.push({ level: "green", text: `בממוצע כל מבקר צופה ב-${avgPages} עמודים/מדורים בביקור באתר.` });
    }

    const totalSourced = Object.values(sources).reduce((a, b) => a + b, 0);
    if (totalSourced > 0) {
      const directPct = Math.round(((sources.direct || 0) / totalSourced) * 1000) / 10;
      if (directPct >= 25) {
        insights.push({
          level: "orange",
          text: `${directPct}% מהכניסות הן ישירות או ממקור לא ידוע — קשה לדעת מאיפה מגיעים גולשים. שיתוף קישורים עם מעקב (utm) יעזור לזהות מקורות בעתיד.`
        });
      }
      const sortedSrc = Object.entries(sources).sort((a, b) => b[1] - a[1]);
      if (sortedSrc.length >= 2) {
        const [name, count] = sortedSrc[1];
        const pct = Math.round((count / totalSourced) * 1000) / 10;
        insights.push({ level: "gray", text: `המקור השני בגודלו הוא ${SRC_LABELS[name] || name} (${pct}%).` });
      }
    }

    const topPageSorted = Object.entries(topPages).sort((a, b) => b[1] - a[1]);
    if (topPageSorted.length) {
      insights.push({
        level: "gray",
        text: `המדור הכי נצפה הוא "${topPageSorted[0][0]}" עם ${topPageSorted[0][1]} צפיות.`
      });
    }

    const maxDay = dailyTrend.slice().sort((a, b) => b.pageviews - a.pageviews)[0];
    if (maxDay && maxDay.pageviews > 0) {
      insights.push({ level: "gray", text: `היום הכי פעיל בטווח היה ב-${maxDay.date} עם ${maxDay.pageviews} כניסות.` });
    }

    const weekendVals: number[] = [];
    const weekdayVals: number[] = [];
    dailyTrend.forEach((d) => {
      const dow = new Date(d.date + "T00:00:00Z").getUTCDay(); // 5=Fri, 6=Sat
      if (dow === 5 || dow === 6) weekendVals.push(d.pageviews);
      else weekdayVals.push(d.pageviews);
    });
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const avgWeekend = avg(weekendVals);
    const avgWeekday = avg(weekdayVals);
    if (avgWeekday > 0 && weekendVals.length && weekdayVals.length) {
      const liftPct = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 1000) / 10;
      const dir2 = liftPct >= 0 ? "גבוהה" : "נמוכה";
      insights.push({
        level: "gray",
        text: `התנועה בסוף"ש (שישי-שבת) ${dir2} ב-${Math.abs(liftPct)}% בממוצע לעומת ימות השבוע.`
      });
    }

    return json({
      ok: true,
      range: { days, from: dateList[dateList.length - 1], to: dateList[0] },
      totals: {
        pageviews,
        visitors: visitors.size,
        newVisitors: newVisitors.size,
        sessions: sessions.size,
        whatsapp,
        phone,
        forms,
        instagram,
        conversionRate,
        avgPerDay: Math.round((pageviews / days) * 10) / 10
      },
      allTime: {
        days: allTimeDays,
        pageviews: allTimeTotals.pageviews,
        visitors: allTimeTotals.visitors
      },
      sources,
      buttons,
      reels,
      scrollBuckets,
      trend,
      topPages,
      geo,
      deviceCounts,
      browserCounts,
      insights,
      clickPoints: clickPoints.slice(0, 3000)
    });
  }

  // ---------- leads ----------
  if (action === "leads" && req.method === "GET") {
    const store = getStore("leads");
    const { blobs } = await store.list({ prefix: "leads/" });
    const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    const leads = items.filter(Boolean).sort((a: any, b: any) => b.ts - a.ts);
    return json({ ok: true, leads });
  }

  if (action === "leads" && req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== "string" || typeof body.status !== "string") {
      return json({ ok: false, error: "missing id/status" }, 400);
    }
    const store = getStore("leads");
    const key = `leads/${body.id}.json`;
    const existing = await store.get(key, { type: "json" });
    if (!existing) return json({ ok: false, error: "not found" }, 404);
    existing.status = body.status;
    await store.setJSON(key, existing);
    return json({ ok: true });
  }

  // ---------- content ----------
  if (action === "content" && req.method === "GET") {
    const store = getStore("content");
    const saved = await store.get("site.json", { type: "json" });
    const merged = Object.assign({}, DEFAULT_CONTENT, saved || {});
    return json({ ok: true, content: merged, hasCustomSave: !!saved });
  }

  if (action === "content" && req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ ok: false, error: "bad body" }, 400);
    const store = getStore("content");
    const prev = await store.get("site.json", { type: "json" });
    if (prev) {
      const versions = getStore("content-versions");
      await versions.setJSON(`versions/${Date.now()}.json`, prev);
      const { blobs } = await versions.list({ prefix: "versions/" });
      const sorted = blobs.map((b) => b.key).sort();
      const excess = sorted.slice(0, Math.max(0, sorted.length - 20));
      await Promise.all(excess.map((k) => versions.delete(k)));
    }
    await store.setJSON("site.json", body);
    return json({ ok: true });
  }

  // ---------- versions ----------
  if (action === "versions" && req.method === "GET") {
    const versions = getStore("content-versions");
    const { blobs } = await versions.list({ prefix: "versions/" });
    const sorted = blobs.map((b) => b.key).sort().reverse().slice(0, 20);
    return json({
      ok: true,
      versions: sorted.map((k) => ({ key: k, ts: Number(k.split("/")[1].replace(".json", "")) }))
    });
  }

  if (action === "restore" && req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.key !== "string") return json({ ok: false, error: "missing key" }, 400);
    const versions = getStore("content-versions");
    const snapshot = await versions.get(body.key, { type: "json" });
    if (!snapshot) return json({ ok: false, error: "not found" }, 404);
    const store = getStore("content");
    const current = await store.get("site.json", { type: "json" });
    if (current) {
      await versions.setJSON(`versions/${Date.now()}.json`, current);
    }
    await store.setJSON("site.json", snapshot);
    return json({ ok: true });
  }

  // ---------- media upload ----------
  if (action === "media" && req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.dataBase64 !== "string" || typeof body.contentType !== "string") {
      return json({ ok: false, error: "missing file data" }, 400);
    }
    if (!/^image\//.test(body.contentType)) {
      return json({ ok: false, error: "רק תמונות מותרות" }, 400);
    }
    let bytes: Uint8Array;
    try {
      const bin = atob(body.dataBase64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch {
      return json({ ok: false, error: "קובץ לא תקין" }, 400);
    }
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      return json({ ok: false, error: "הקובץ גדול מדי (מקסימום 6MB)" }, 400);
    }
    const ext = body.contentType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
    const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const store = getStore("media");
    await store.set(key, bytes, { metadata: { contentType: body.contentType } });
    return json({ ok: true, url: `/api/media/${key}` });
  }

  // ---------- export ----------
  if (action === "export" && req.method === "GET") {
    const type = url.searchParams.get("type") || "leads";
    if (type === "leads") {
      const store = getStore("leads");
      const { blobs } = await store.list({ prefix: "leads/" });
      const items = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
      items.sort((a: any, b: any) => b.ts - a.ts);
      const csv = toCSV(
        items.map((l: any) => ({
          תאריך: new Date(l.ts).toLocaleString("he-IL"),
          שם: l.name,
          טלפון: l.phone,
          אימייל: l.email,
          עיר: l.city,
          תקציב: l.budget,
          הודעה: l.message,
          מקור: l.attribution?.firstTouch?.source || "",
          קמפיין: l.attribution?.firstTouch?.campaign || "",
          עמוד: l.path,
          "הסכמה לדיוור": l.marketingConsent ? "כן" : "לא",
          סטטוס: l.status
        }))
      );
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="leads.csv"'
        }
      });
    }
    return json({ ok: false, error: "unknown export type" }, 400);
  }

  return json({ ok: false, error: "not found" }, 404);
};

export const config: Config = {
  path: "/api/admin/*"
};
