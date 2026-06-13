# TourFireMai 🔥

รวม **ทัวร์ไฟไหม้** (last-minute / discounted tour packages) จากบริษัททัวร์ชั้นนำของไทย — คัดและจัดอันดับอัตโนมัติด้วยคะแนน **ความร้อนแรง** (ใกล้วันเดินทาง + ที่นั่งเหลือน้อย + ราคาดี) อัปเดตทุกวัน

The #1 Thai tour-deal aggregator: surfaces the most **urgent + cheapest + seats-available** packages, with award-tier 2026 design and best-in-class SEO / AEO / GEO.

## How it works

```
GitHub Actions (every 6h)  ──►  npm run refresh
   per-source adapters: discover() → fetchOne() → RawTour[]
   → normalize → score (urgency · deal · fire) → dedupe
   → write static/data/deals.json → git commit → push
        │
        ▼  (push triggers redeploy)
SvelteKit (adapter-vercel, fully prerendered)
   /                     ranked hot-deal feed (ItemList + FAQ JSON-LD)
   /tour/[slug]          detail page (TouristTrip + Offer JSON-LD, link-out to operator)
   /destination/[c]      per-country landing pages
   /search               client-side filter (country / price / sort)
   /sitemap.xml /robots.txt /feed.xml /llms.txt   ← emitted for SEO/AEO/GEO
```

**Model:** aggregate + link out. Every tour links to the operator's own page (“จองที่ …”); no bookings/payments here.

## Sources (no RSS exists — each uses a tailored adapter)

| Operator | Method |
|----------|--------|
| นิดหน่อยทราเวล (Nidnoi) | Embedded JSON in tour pages (ISO dates, prices, real seat counts, discount) |
| ทราเวลซี้ด (Travelzeed) | Daily product sitemap → SSR HTML (price + departure table) |
| ยูนิไทยทราเวล (Unithai) | `trip_detail2.php` (`เริ่ม ฿` price) |
| อัพ-โอเปอเรชั่น (Up-Operation) | `tourfiremai.com` SSR HTML (`/cview/`) |

Add a source: write one adapter in `src/lib/sources/` implementing `discover()` + `fetchOne()`, register it in `src/lib/sources/index.ts`, set `enabled: true`.

## Scoring

- **urgencyScore** — closeness of next departure + low-seats bonus
- **dealScore** — price vs per-country median + discount bonus
- **fireScore** — `0.55·urgency + 0.45·deal` (homepage ranking)

## Develop

```bash
npm install          # uses a project-local npm cache (.npmrc)
npm run dev          # local dev server
npm run refresh      # fetch live data → static/data/deals.json
npm run build        # prerender the whole site
npm test             # 37 unit tests (scoring, normalize, adapters vs fixtures)
npm run check        # svelte-check / tsc
```

## Deploy

1. **Vercel** — import the repo (framework auto-detected). Optional env `CRON_SECRET` to guard the manual refresh route `/api/cron/refresh`.
2. **Data refresh** — `.github/workflows/refresh.yml` runs every 6h, regenerates `deals.json`, and pushes (which redeploys). Trigger manually via the Actions tab (`workflow_dispatch`).

## Tech

SvelteKit 2 · Svelte 4 · Vite 5 · TypeScript · `node-html-parser` · `iconv-lite` · Vitest · `@sveltejs/adapter-vercel`. Images proxied/optimized via [wsrv.nl](https://wsrv.nl).

---

> ⚠️ TourFireMai เป็นผู้รวบรวมข้อมูลเท่านั้น ราคาและที่นั่งอาจเปลี่ยนแปลง โปรดยืนยันกับบริษัททัวร์ต้นทางก่อนตัดสินใจ
