# TourFireMai — Design Spec

**Date:** 2026-06-13
**Status:** Approved for planning
**Goal:** The #1 Thai "ทัวร์ไฟไหม้" (fire-sale / last-minute tour deal) aggregator — surfacing the most **urgent + cheapest + seats-available** tour packages from top-tier Thai operators, auto-refreshed via Vercel cron, with award-tier 2026 design and best-in-class SEO/AEO/GEO.

---

## 1. Product summary

TourFireMai aggregates live tour-package deals from multiple Thai tour operators, normalizes them into one schema, scores each by **urgency** (departure soon + low seats) and **deal quality** (price vs peers + discount), and presents a fast, beautiful, SEO-rich site. We do **not** take bookings — each tour links out to the operator's own page ("จองที่ {operator}"). Same model as the reference competitor `firemaitour.xyz`, executed better.

### Customer pain points we solve (Thai fire-sale tour shoppers)
- **Scam fear** → show operator name, license, logo, and link only to official operator pages.
- **Fake urgency** → only show real seat counts / real soldout flags from source data.
- **Price opacity** → show price, original price, and computed discount %.
- **Slow discovery** → one ranked feed of the genuinely-best deals, refreshed every few hours.
- **Friction to buy** → one tap to the operator + LINE/share.

---

## 2. Verified data sources (reverse-engineered 2026-06-13)

The "RSS feed" premise does not exist — no operator publishes RSS. Reverse-engineered from `firemaitour.xyz` (Next.js/Vercel, uses `wsrv.nl` image proxy, emits schema.org `ItemList`). Each source gets a **per-source adapter** returning a normalized `Tour[]`. All 4 ship in v1.

| # | Operator | Method | Key details |
|---|----------|--------|-------------|
| 1 | **Nidnoi** (นิดหน่อยทราเวล) | **Embedded JSON** (best) | URL `nidnoitravel.com/tour/nidn{ID}/`. Page embeds HTML-entity-escaped JSON: `period_start_value` (ISO), `period_end_value`, `price_adults_double`, `price_before_discount`, `number_seats`, `period_soldout`, `stay_day/night`, airline icon, `product_id`. Unescape `&quot;` → `JSON.parse`. Discover IDs from sitemap `nidnoitravel.com/sitemap_index.xml` (NOT the stale 2019 `/package-tour/` one — use the live `/tour/nidn{ID}/` pattern). |
| 2 | **Travelzeed** (ทราเวลซี้ด) | **Sitemap + SSR HTML** | Sitemap `travelzeed.com/sitemap-tour-products.xml` (~2000 urls, `changefreq=daily`, per-url `lastmod` → diff to fetch only changed). Tour `/tour/detail/{id}`. Parse `<title>`, price `ราคา 11,900 บาท`, dates table (วันเดินทาง\|ราคา), `จำนวนวัน` "5 วัน 3 คืน", airline `<img alt>`. robots.txt allows `/tour/`. |
| 3 | **Unithai** (ยูนิไทยทราเวล) | **PHP + AJAX, decode** | Detail `unithaitravel.com/th/trip_detail2.php?route_id={code}` (title/desc). Prices/periods `…/trip_book.php?route_id={code}`. Numeric codes (e.g. 51004). Homepage JS-rendered. **Text is UTF-8 bytes mislabeled — decode with iconv TIS-620→UTF-8.** Images `unithaitravel.com/__files/t/ch/{code}-sm.jpg`. Discover codes by crawling category/listing pages. |
| 4 | **Up-Operation** (tourfiremai.com) | **SSR HTML** | Clean routes: `/country`, `/domestic/{id}/{name}`, `/cview/{slug}`. robots.txt allows all but `/backoffice/`. Parse listing → detail. |

**Politeness:** custom User-Agent identifying TourFireMai, ~5 concurrent max per source, small delay, respect robots.txt, lastmod-diff caching to minimize fetches.

---

## 3. Architecture

```
┌─ Vercel Cron (every 6h: 0 */6 * * *) ──────────────────────┐
│  GET /api/cron/refresh   (CRON_SECRET-guarded)              │
│   1. for each enabled adapter in sources.ts:                │
│        urls = await adapter.discover()   // sitemap/listing │
│        tours = await adapter.fetch(urls) // parse → Tour[]  │
│   2. normalize → dedupe → score (urgency, deal)             │
│   3. write static/deals.json (+ per-country shards)         │
│   4. git commit + push  ──► triggers Vercel redeploy        │
└──────────────────────────────────────────────────────────────┘
        │ deals.json committed to repo
        ▼
┌─ SvelteKit (adapter-vercel, prerendered SSG) ──────────────┐
│  /                  Hot deals feed (ranked by fire score)   │
│  /tour/[slug]       Detail (rich SEO/AEO/GEO, JSON-LD)      │
│  /destination/[c]   Country landing pages                  │
│  /search            Client-side filter (country/price/date)│
│  /sitemap.xml /robots.txt /feed.xml  ← WE emit these        │
│  All static → CDN → near-perfect Lighthouse                │
└──────────────────────────────────────────────────────────────┘
```

**Why SvelteKit + commit-to-repo:** smallest JS bundle / fastest hydration (best Lighthouse → best SEO), zero database cost, fully static/CDN-served. Cron commits JSON → redeploy is the storage layer.

**Why a build-time scrape + commit (not request-time):** keeps pages 100% static for SEO and speed; data freshness of 6h is ample for tour deals.

---

## 4. Normalized data model

```ts
type Tour = {
  id: string;              // `${source}-${sourceId}`  e.g. "nidnoi-261912"
  slug: string;            // url-safe, includes country + id
  source: 'nidnoi' | 'travelzeed' | 'unithai' | 'uphol';
  sourceUrl: string;       // operator page to "จอง"
  title: string;
  country: string;         // normalized: japan, china, korea, vietnam, …
  city?: string;
  image?: string;          // proxied via wsrv.nl
  airline?: string;
  nights?: number; days?: number;
  periods: Array<{
    departISO: string; returnISO?: string;
    price: number;            // THB, lead adult price
    priceBefore?: number;     // for discount %
    seats?: number;           // real if source provides
    soldOut?: boolean;
  }>;
  priceFrom: number;          // min across periods
  discountPct?: number;
  nextDepartISO?: string;     // soonest non-soldout period
  fetchedAtISO: string;
  // computed:
  urgencyScore: number;       // 0..100
  dealScore: number;          // 0..100
  fireScore: number;          // weighted blend → ranking
};
```

### Scoring (heuristics, graceful degradation)
- **urgencyScore** = f(days to `nextDepartISO`, inverse) + low-seats bonus (seats ≤ 5) + soldout-pressure (few periods left). Missing seats → date-only.
- **dealScore** = price percentile vs same-country tours (cheaper = higher) + discountPct bonus.
- **fireScore** = `0.55*urgency + 0.45*deal`. Homepage sorts desc. 🔥 badge tiers by fireScore.

---

## 5. Design system (award-tier 2026)

- **Aesthetic:** clean, editorial, "premium travel-tech." Generous whitespace, large type scale, soft depth. Signature **warm gradient** (fire/sunset: amber→coral→magenta) used sparingly on the fire-score badge, CTAs, and hero accents — not everywhere.
- **Type:** Thai-first. `IBM Plex Sans Thai` / `Noto Sans Thai` for body (excellent Thai rendering), a refined display face for headings. Subset + `font-display: swap`.
- **Color:** near-black ink on warm white; fire gradient as the one bold accent; semantic colors for urgency (red = ด่วน/seats low) and deal (green = discount).
- **Tour card:** image (lazy, wsrv.nl, AVIF/WebP), country chip, title (2-line clamp), airline, nights/days, **price + struck original + discount %**, **🔥 fire badge** + reason line ("ออกเดินทางใน 3 วัน • เหลือ 4 ที่"), source logo, "จองที่ {operator}" button.
- **Motion:** subtle — card hover lift, badge shimmer on top deals, reduced-motion respected.
- **Responsive & a11y:** mobile-first (most Thai traffic is mobile), WCAG AA contrast, keyboard nav, semantic HTML.
- **Dark mode:** yes (system-pref + toggle).

---

## 6. SEO / AEO / GEO

- **SEO:** prerendered HTML, per-page `<title>`/meta/canonical/OG/Twitter, we emit `sitemap.xml` + `feed.xml`, fast LCP/CLS, internal linking (country pages ↔ tours), Thai keyword-rich copy ("ทัวร์ไฟไหม้ {ประเทศ}", "โปรทัวร์ลดราคา", "ทัวร์ราคาถูก ที่นั่งเหลือน้อย").
- **AEO (answer engines):** schema.org JSON-LD on every page — `ItemList` (feed), `TouristTrip`/`Product` + `Offer` (price, priceCurrency THB, availability, validThrough = depart date), `BreadcrumbList`, `Organization`. Concise FAQ blocks ("ทัวร์ไฟไหม้คืออะไร", "จองอย่างไร") with `FAQPage` schema.
- **GEO (generative engine optimization):** clean factual summaries per tour, stable URLs, machine-readable JSON-LD so LLMs/answer engines cite us; an `llms.txt` describing the dataset; structured, quotable deal facts.

---

## 7. Components / modules (isolated, testable)

| Module | Responsibility | Depends on |
|--------|----------------|------------|
| `lib/sources/*.ts` | one adapter per operator: `discover()`, `fetch()` → `RawTour[]` | fetch, html-parser, iconv |
| `lib/sources/index.ts` | registry `{id, enabled, adapter}` | adapters |
| `lib/normalize.ts` | RawTour → Tour, country mapping, image-proxy URL | — |
| `lib/score.ts` | urgency/deal/fire scoring (pure fns) | — |
| `lib/dedupe.ts` | merge same tour across periods/sources | — |
| `api/cron/refresh` | orchestrate discover→fetch→score→write→commit | all lib + git |
| `routes/*` | SvelteKit pages, prerendered | deals.json |
| `lib/seo.ts` | JSON-LD + meta builders | — |

Each adapter is independently unit-testable with a saved HTML/JSON fixture (we captured real samples in `/tmp` during research — promote to `tests/fixtures/`).

---

## 8. Testing
- **Unit:** `score.ts`, `normalize.ts`, `dedupe.ts` (pure → easy). Each adapter parses a committed fixture into the expected `Tour[]`.
- **Integration:** cron handler against fixtures → valid `deals.json`.
- **E2E/smoke:** build succeeds, key routes prerender, JSON-LD validates, Lighthouse ≥ 95.

## 9. Error handling
- Per-adapter try/catch — one source failing never breaks the run; log + skip, keep last good data for that source.
- Network: retry w/ backoff, timeout, concurrency cap.
- Parse: if a field is missing, degrade (no price → exclude from deal ranking but may still list).
- Cron auth via `CRON_SECRET`. Empty/zero-tour result → abort commit (don't wipe good data).

## 10. Deploy
- Vercel project, SvelteKit `adapter-vercel`. `vercel.json` cron `0 */6 * * *` → `/api/cron/refresh`.
- Push to `github.com/johnnyduo/tourfiremai` (commits authored `774767+johnnyduo@users.noreply.github.com`).
- Env: `CRON_SECRET`, `GIT_*` for the bot commit.

## 11. Out of scope (v1)
- Bookings/payments, user accounts, price-history charts, notifications/alerts, non-Thai i18n. (Lead-capture deferred — model is aggregate + link out.)

## 12. Open inputs
- Facebook group comments (login-gated, couldn't fetch) — user may paste later to refine copy/features.
