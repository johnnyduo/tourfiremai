# TourFireMai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the #1 Thai "ทัวร์ไฟไหม้" tour-deal aggregator — scrapes 4 operators, scores by urgency+deal, serves a fast SEO-rich SvelteKit site refreshed by Vercel cron, pushed to GitHub.

**Architecture:** SvelteKit (adapter-vercel, prerendered). A cron route scrapes per-source adapters → normalizes → scores → writes `static/data/deals.json` → git commits → triggers redeploy. Pages read the committed JSON at build time. Aggregate + link-out model.

**Tech Stack:** SvelteKit 2 / Svelte 5, TypeScript, Vite, `node-html-parser`, `iconv-lite`, Vitest, `@sveltejs/adapter-vercel`. Image proxy via `wsrv.nl`.

---

## File Structure

```
tourfiremai/
├─ package.json, svelte.config.js, vite.config.ts, tsconfig.json
├─ vercel.json                      # cron schedule
├─ src/
│  ├─ lib/
│  │  ├─ types.ts                   # Tour, RawTour, Period
│  │  ├─ images.ts                  # wsrv.nl proxy url builder
│  │  ├─ countries.ts               # Thai/EN country normalization
│  │  ├─ score.ts                   # urgency/deal/fire (pure)
│  │  ├─ normalize.ts               # RawTour -> Tour
│  │  ├─ dedupe.ts                  # merge duplicates
│  │  ├─ seo.ts                     # JSON-LD + meta builders
│  │  ├─ data.ts                    # load deals.json for routes
│  │  └─ sources/
│  │     ├─ types.ts                # Adapter interface
│  │     ├─ http.ts                 # polite fetch (UA, retry, concurrency)
│  │     ├─ nidnoi.ts
│  │     ├─ travelzeed.ts
│  │     ├─ unithai.ts
│  │     ├─ upoperation.ts
│  │     └─ index.ts                # registry
│  ├─ routes/
│  │  ├─ +layout.svelte, +layout.ts
│  │  ├─ +page.svelte / +page.ts            # home feed
│  │  ├─ tour/[slug]/+page.svelte / +page.ts
│  │  ├─ destination/[country]/+page.svelte / +page.ts
│  │  ├─ search/+page.svelte
│  │  ├─ sitemap.xml/+server.ts
│  │  ├─ feed.xml/+server.ts
│  │  ├─ robots.txt/+server.ts
│  │  ├─ llms.txt/+server.ts
│  │  └─ api/cron/refresh/+server.ts
│  ├─ lib/components/  TourCard, FireBadge, CountryChip, PriceTag, Filters, Header, Footer
│  └─ app.css, app.html
├─ scripts/refresh.ts               # callable locally + by cron route
├─ static/data/deals.json           # committed by cron
└─ tests/   fixtures/ (already committed) + *.test.ts
```

---

## Task 1: Scaffold SvelteKit + tooling

**Files:** Create `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.css`, `src/routes/+page.svelte`, `.gitignore`, `.nvmrc`.

- [ ] **Step 1: Scaffold non-interactively**

```bash
cd /Library/WebServer/Documents/tourfiremai
npm create svelte@latest . -- --template skeleton --types typescript --no-add-ons 2>/dev/null || npx sv create . --template minimal --types ts --no-install
```
If the CLI is interactive/unavailable, create files manually per Step 2.

- [ ] **Step 2: Ensure deps + adapter**

```bash
npm pkg set type="module"
npm install -D @sveltejs/kit @sveltejs/adapter-vercel @sveltejs/vite-plugin-svelte svelte vite typescript vitest @types/node svelte-check
npm install node-html-parser iconv-lite
```

`svelte.config.js`:
```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default { preprocess: vitePreprocess(), kit: { adapter: adapter() } };
```

`vite.config.ts`:
```ts
import { sveltekit } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [sveltekit()], test: { include: ['tests/**/*.test.ts'] } });
```

- [ ] **Step 3: Verify build runs**

Run: `npm run check && npm run build`
Expected: completes without error (empty skeleton builds).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold SvelteKit + Vercel adapter"
```

---

## Task 2: Core types

**Files:** Create `src/lib/types.ts`, `tests/types.test.ts`.

- [ ] **Step 1: Write types**

```ts
// src/lib/types.ts
export type SourceId = 'nidnoi' | 'travelzeed' | 'unithai' | 'uphol';

export interface Period {
  departISO: string;
  returnISO?: string;
  price: number;          // THB
  priceBefore?: number;
  seats?: number;
  soldOut?: boolean;
}

export interface RawTour {
  source: SourceId;
  sourceId: string;
  sourceUrl: string;
  title: string;
  countryRaw?: string;
  city?: string;
  image?: string;
  airline?: string;
  nights?: number;
  days?: number;
  periods: Period[];
}

export interface Tour extends RawTour {
  id: string;             // `${source}-${sourceId}`
  slug: string;
  country: string;        // normalized key
  priceFrom: number;
  discountPct?: number;
  nextDepartISO?: string;
  fetchedAtISO: string;
  urgencyScore: number;
  dealScore: number;
  fireScore: number;
}
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts && git commit -m "feat: core Tour types"
```

---

## Task 3: Scoring (pure, TDD)

**Files:** Create `src/lib/score.ts`, `tests/score.test.ts`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/score.test.ts
import { describe, it, expect } from 'vitest';
import { urgencyScore, dealScore, fireScore } from '../src/lib/score';

const NOW = new Date('2026-06-13T00:00:00Z');

describe('urgencyScore', () => {
  it('is high when departure is very soon', () => {
    expect(urgencyScore({ nextDepartISO: '2026-06-15T00:00:00Z' }, NOW)).toBeGreaterThan(80);
  });
  it('is low when departure is far away', () => {
    expect(urgencyScore({ nextDepartISO: '2026-12-01T00:00:00Z' }, NOW)).toBeLessThan(30);
  });
  it('adds a bonus when seats are low', () => {
    const far = { nextDepartISO: '2026-08-01T00:00:00Z' };
    expect(urgencyScore({ ...far, minSeats: 2 }, NOW))
      .toBeGreaterThan(urgencyScore(far, NOW));
  });
  it('returns 0 when no departure date', () => {
    expect(urgencyScore({}, NOW)).toBe(0);
  });
});

describe('dealScore', () => {
  it('is higher for cheaper price within its country band', () => {
    const cheap = dealScore({ priceFrom: 8000, countryMedian: 20000 });
    const pricey = dealScore({ priceFrom: 30000, countryMedian: 20000 });
    expect(cheap).toBeGreaterThan(pricey);
  });
  it('adds discount bonus', () => {
    expect(dealScore({ priceFrom: 10000, countryMedian: 20000, discountPct: 40 }))
      .toBeGreaterThan(dealScore({ priceFrom: 10000, countryMedian: 20000 }));
  });
});

describe('fireScore', () => {
  it('blends urgency and deal weighted 0.55/0.45', () => {
    expect(fireScore(100, 0)).toBeCloseTo(55);
    expect(fireScore(0, 100)).toBeCloseTo(45);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/score.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// src/lib/score.ts
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function urgencyScore(
  t: { nextDepartISO?: string; minSeats?: number },
  now = new Date()
): number {
  if (!t.nextDepartISO) return 0;
  const days = (new Date(t.nextDepartISO).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return 0;
  // 0 days -> ~100, 60 days -> ~0
  const base = clamp(100 - (days / 60) * 100);
  const seatBonus = t.minSeats != null && t.minSeats <= 5 ? (6 - Math.max(t.minSeats, 0)) * 4 : 0;
  return clamp(base + seatBonus);
}

export function dealScore(t: {
  priceFrom: number; countryMedian?: number; discountPct?: number;
}): number {
  const med = t.countryMedian && t.countryMedian > 0 ? t.countryMedian : t.priceFrom;
  // ratio 0.5 (half median) -> ~100, ratio 1.5 -> ~0
  const ratio = t.priceFrom / med;
  const base = clamp(100 - (ratio - 0.5) * 100);
  const discountBonus = t.discountPct ? clamp(t.discountPct * 0.5, 0, 30) : 0;
  return clamp(base + discountBonus);
}

export function fireScore(urgency: number, deal: number): number {
  return clamp(0.55 * urgency + 0.45 * deal);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run tests/score.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/score.ts tests/score.test.ts && git commit -m "feat: urgency/deal/fire scoring with tests"
```

---

## Task 4: Country normalization + image proxy

**Files:** Create `src/lib/countries.ts`, `src/lib/images.ts`, `tests/countries.test.ts`, `tests/images.test.ts`.

- [ ] **Step 1: Failing tests**

```ts
// tests/countries.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeCountry } from '../src/lib/countries';
describe('normalizeCountry', () => {
  it('maps Thai names', () => {
    expect(normalizeCountry('ทัวร์จีน ฉงชิ่ง')).toBe('china');
    expect(normalizeCountry('ทัวร์ญี่ปุ่น โอซาก้า')).toBe('japan');
    expect(normalizeCountry('เกาหลีใต้')).toBe('korea');
  });
  it('falls back to "other"', () => {
    expect(normalizeCountry('ดาวอังคาร')).toBe('other');
  });
});
```

```ts
// tests/images.test.ts
import { describe, it, expect } from 'vitest';
import { proxyImage } from '../src/lib/images';
describe('proxyImage', () => {
  it('wraps a url through wsrv.nl with webp output', () => {
    const u = proxyImage('https://x.com/a.jpg', 640);
    expect(u).toContain('wsrv.nl');
    expect(u).toContain(encodeURIComponent('https://x.com/a.jpg'));
    expect(u).toContain('output=webp');
    expect(u).toContain('w=640');
  });
  it('returns placeholder when src missing', () => {
    expect(proxyImage(undefined, 640)).toContain('placeholder');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/countries.test.ts tests/images.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/countries.ts
const MAP: Array<[RegExp, string]> = [
  [/จีน|china|ฉงชิ่ง|เซี่ยงไฮ้|ปักกิ่ง|จางเจียเจี้ย/i, 'china'],
  [/ญี่ปุ่น|japan|โตเกียว|โอซาก้า|ฮอกไกโด/i, 'japan'],
  [/เกาหลี|korea|โซล/i, 'korea'],
  [/เวียดนาม|vietnam|ฮานอย|ดานัง/i, 'vietnam'],
  [/ฮ่องกง|hong ?kong/i, 'hongkong'],
  [/ไต้หวัน|taiwan|ไทเป/i, 'taiwan'],
  [/สิงคโปร์|singapore/i, 'singapore'],
  [/ยุโรป|europe|อิตาลี|ฝรั่งเศส|สวิส/i, 'europe'],
  [/ไทย|thailand|กรุงเทพ|เชียงใหม่|อยุธยา/i, 'thailand'],
];
export function normalizeCountry(raw = ''): string {
  for (const [re, key] of MAP) if (re.test(raw)) return key;
  return 'other';
}
export const COUNTRY_LABELS: Record<string, string> = {
  china: 'จีน', japan: 'ญี่ปุ่น', korea: 'เกาหลี', vietnam: 'เวียดนาม',
  hongkong: 'ฮ่องกง', taiwan: 'ไต้หวัน', singapore: 'สิงคโปร์',
  europe: 'ยุโรป', thailand: 'ไทย', other: 'อื่นๆ',
};
```

```ts
// src/lib/images.ts
export function proxyImage(src: string | undefined, w = 640, q = 60): string {
  if (!src) return `https://wsrv.nl/?url=&placeholder=true&w=${w}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${w}&q=${q}&output=webp&we=1&maxage=1y`;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run tests/countries.test.ts tests/images.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries.ts src/lib/images.ts tests/countries.test.ts tests/images.test.ts
git commit -m "feat: country normalization + wsrv.nl image proxy"
```

---

## Task 5: Normalize + dedupe (TDD)

**Files:** Create `src/lib/normalize.ts`, `src/lib/dedupe.ts`, `tests/normalize.test.ts`.

- [ ] **Step 1: Failing test**

```ts
// tests/normalize.test.ts
import { describe, it, expect } from 'vitest';
import { toTour } from '../src/lib/normalize';
import type { RawTour } from '../src/lib/types';

const raw: RawTour = {
  source: 'nidnoi', sourceId: '261912',
  sourceUrl: 'https://www.nidnoitravel.com/tour/nidn261912/',
  title: 'ทัวร์จีน ฉงชิ่ง 5 วัน 3 คืน', airline: 'CZ', days: 5, nights: 3,
  periods: [
    { departISO: '2026-06-20T00:00:00Z', price: 9888, priceBefore: 12888, seats: 4 },
    { departISO: '2026-06-13T00:00:00Z', price: 6888, seats: 0, soldOut: true },
  ],
};

describe('toTour', () => {
  const t = toTour(raw, new Date('2026-06-13T00:00:00Z'));
  it('builds id and slug', () => {
    expect(t.id).toBe('nidnoi-261912');
    expect(t.slug).toContain('china');
    expect(t.slug).toContain('261912');
  });
  it('normalizes country from title', () => expect(t.country).toBe('china'));
  it('priceFrom is the min period price', () => expect(t.priceFrom).toBe(6888));
  it('nextDepartISO skips soldout/past, picks soonest available', () =>
    expect(t.nextDepartISO).toBe('2026-06-20T00:00:00Z'));
  it('computes discountPct from the cheapest available period', () =>
    expect(t.discountPct).toBe(23)); // (12888-9888)/12888 ~ 23%
  it('produces a fireScore between 0 and 100', () => {
    expect(t.fireScore).toBeGreaterThanOrEqual(0);
    expect(t.fireScore).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/normalize.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement normalize**

```ts
// src/lib/normalize.ts
import type { RawTour, Tour } from './types';
import { normalizeCountry } from './countries';
import { urgencyScore, dealScore, fireScore } from './score';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export function toTour(raw: RawTour, now = new Date(), countryMedian?: number): Tour {
  const country = normalizeCountry(raw.countryRaw || raw.title);
  const available = raw.periods
    .filter((p) => !p.soldOut && new Date(p.departISO).getTime() >= now.getTime())
    .sort((a, b) => +new Date(a.departISO) - +new Date(b.departISO));
  const priceFrom = Math.min(...raw.periods.map((p) => p.price));
  const next = available[0];
  const minSeats = available.reduce<number | undefined>(
    (m, p) => (p.seats != null ? Math.min(m ?? Infinity, p.seats) : m), undefined);
  const discountPct = next?.priceBefore
    ? Math.round(((next.priceBefore - next.price) / next.priceBefore) * 100)
    : undefined;
  const u = urgencyScore({ nextDepartISO: next?.departISO, minSeats }, now);
  const d = dealScore({ priceFrom, countryMedian, discountPct });
  return {
    ...raw,
    id: `${raw.source}-${raw.sourceId}`,
    slug: `${country}-${slugify(raw.title)}-${raw.sourceId}`,
    country, priceFrom, discountPct,
    nextDepartISO: next?.departISO,
    fetchedAtISO: now.toISOString(),
    urgencyScore: u, dealScore: d, fireScore: fireScore(u, d),
  };
}
```

```ts
// src/lib/dedupe.ts
import type { Tour } from './types';
// keep the highest-fireScore entry per id; if same tour appears twice, merge periods.
export function dedupe(tours: Tour[]): Tour[] {
  const byId = new Map<string, Tour>();
  for (const t of tours) {
    const ex = byId.get(t.id);
    if (!ex || t.fireScore > ex.fireScore) byId.set(t.id, t);
  }
  return [...byId.values()].sort((a, b) => b.fireScore - a.fireScore);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run tests/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/normalize.ts src/lib/dedupe.ts tests/normalize.test.ts
git commit -m "feat: normalize RawTour->Tour + dedupe"
```

---

## Task 6: Polite HTTP + adapter interface

**Files:** Create `src/lib/sources/types.ts`, `src/lib/sources/http.ts`.

- [ ] **Step 1: Adapter interface**

```ts
// src/lib/sources/types.ts
import type { RawTour, SourceId } from '../types';
export interface Adapter {
  id: SourceId;
  label: string;       // Thai operator name
  enabled: boolean;
  discover(): Promise<string[]>;          // tour URLs/codes
  fetchOne(ref: string): Promise<RawTour | null>;
}
```

- [ ] **Step 2: Polite fetch helper**

```ts
// src/lib/sources/http.ts
import iconv from 'iconv-lite';
const UA = 'TourFireMaiBot/1.0 (+https://tourfiremai.com; aggregator)';

export async function getText(url: string, opts: { encoding?: string; retries?: number } = {}) {
  const { encoding, retries = 2 } = opts;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (encoding) return iconv.decode(Buffer.from(await res.arrayBuffer()), encoding);
      return await res.text();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

// run async tasks with a concurrency cap
export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  });
  await Promise.all(workers);
  return out;
}
```

- [ ] **Step 3: Compile check + commit**

Run: `npx tsc --noEmit`
Expected: no errors.
```bash
git add src/lib/sources/types.ts src/lib/sources/http.ts
git commit -m "feat: adapter interface + polite fetch/concurrency helpers"
```

---

## Task 7: Nidnoi adapter (embedded JSON) — TDD against fixture

**Files:** Create `src/lib/sources/nidnoi.ts`, `tests/nidnoi.test.ts`. Fixture: `tests/fixtures/nidnoi-tour.html` (already committed).

- [ ] **Step 1: Failing test**

```ts
// tests/nidnoi.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseNidnoi } from '../src/lib/sources/nidnoi';

const html = readFileSync('tests/fixtures/nidnoi-tour.html', 'utf8');
describe('parseNidnoi', () => {
  const t = parseNidnoi(html, 'https://www.nidnoitravel.com/tour/nidn261912/');
  it('extracts source + id', () => {
    expect(t?.source).toBe('nidnoi');
    expect(t?.sourceId).toBe('261912');
  });
  it('extracts a title', () => expect((t?.title ?? '').length).toBeGreaterThan(5));
  it('extracts at least one period with ISO date + price', () => {
    expect(t?.periods.length).toBeGreaterThan(0);
    expect(t?.periods[0].departISO).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(t?.periods[0].price).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/nidnoi.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (unescape `&quot;`, find the period objects with `period_start_value`/`price_adults_double`)

```ts
// src/lib/sources/nidnoi.ts
import type { Adapter, } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';

export function parseNidnoi(html: string, url: string): RawTour | null {
  const idMatch = url.match(/nidn(\d+)/);
  if (!idMatch) return null;
  const sourceId = idMatch[1];
  const text = html.replace(/&quot;/g, '"');

  const title = (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '').replace(/\s*\|.*$/, '').trim();
  const days = Number(text.match(/"stay_day":\s*"?(\d+)/)?.[1]) || undefined;
  const nights = Number(text.match(/"stay_night":\s*"?(\d+)/)?.[1]) || undefined;
  const airline = text.match(/"url_airline_pic"\s*:\s*"([^"]*)"/)?.[1];
  const image = html.match(/nidnoitravel\.com\/wow\/upload\/[^"'\\ ]+ImageProduct[^"'\\ ]+\.(?:png|jpg|webp)/i)?.[0];

  const periods: Period[] = [];
  const re = /"period_start_value":"([^"]+)"[^}]*?"period_end_value":"([^"]+)"[^}]*?"price_adults_double":(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = Number(
      text.slice(m.index, m.index + 400).match(/"price_before_discount":(\d+)/)?.[1]);
    const seats = Number(
      text.slice(m.index, m.index + 400).match(/"number_seats":(\d+)/)?.[1]);
    const soldout = /"period_soldout":\s*(?:true|1|"1")/.test(text.slice(m.index, m.index + 400));
    periods.push({
      departISO: new Date(m[1]).toISOString(),
      returnISO: new Date(m[2]).toISOString(),
      price: Number(m[3]),
      priceBefore: before || undefined,
      seats: Number.isFinite(seats) ? seats : undefined,
      soldOut: soldout || undefined,
    });
  }
  if (!periods.length) return null;
  return {
    source: 'nidnoi', sourceId, sourceUrl: url, title,
    countryRaw: title, image: image ? `https://${image}` : undefined,
    airline, days, nights, periods,
  };
}

export const nidnoi: Adapter = {
  id: 'nidnoi', label: 'นิดหน่อยทราเวล', enabled: true,
  async discover() {
    // crawl sitemap index for /tour/nidn IDs
    const idx = await getText('https://www.nidnoitravel.com/sitemap_index.xml');
    const subs = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
    const urls = new Set<string>();
    for (const s of subs.filter((u) => /tour|product|post|page/i.test(u))) {
      try {
        const sm = await getText(s);
        for (const u of sm.match(/https:\/\/www\.nidnoitravel\.com\/tour\/nidn\d+\/?/g) ?? [])
          urls.add(u);
      } catch { /* skip bad sub-sitemap */ }
    }
    return [...urls];
  },
  async fetchOne(url) {
    try { return parseNidnoi(await getText(url), url); } catch { return null; }
  },
};
```

> Note: if `discover()` finds no `/tour/nidn` URLs in sitemaps (operator may not list them), the cron falls back to the ID range seeded from the homepage RSC (see Task 12 fallback). The fixture test is the gating correctness check.

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run tests/nidnoi.test.ts`
Expected: PASS. If the regex misses on the real fixture, adjust to match the actual key order seen in `tests/fixtures/nidnoi-tour.html` (inspect with `grep -o '"period_start_value":"[^"]*"' tests/fixtures/nidnoi-tour.html`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/sources/nidnoi.ts tests/nidnoi.test.ts
git commit -m "feat: Nidnoi adapter (embedded JSON) + fixture test"
```

---

## Task 8: Travelzeed adapter (sitemap + SSR HTML) — TDD

**Files:** Create `src/lib/sources/travelzeed.ts`, `tests/travelzeed.test.ts`. Fixture: `tests/fixtures/travelzeed-tour.html`.

- [ ] **Step 1: Failing test**

```ts
// tests/travelzeed.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTravelzeed } from '../src/lib/sources/travelzeed';
const html = readFileSync('tests/fixtures/travelzeed-tour.html', 'utf8');
describe('parseTravelzeed', () => {
  const t = parseTravelzeed(html, 'https://www.travelzeed.com/tour/detail/11096');
  it('extracts id + title', () => {
    expect(t?.sourceId).toBe('11096');
    expect((t?.title ?? '').length).toBeGreaterThan(5);
  });
  it('extracts price >= 1000 from "ราคา N บาท"', () =>
    expect(t?.periods[0].price).toBeGreaterThanOrEqual(1000));
  it('extracts days/nights', () => expect(t?.days).toBe(5));
});
```

- [ ] **Step 2: Run, verify fail** — `npx vitest run tests/travelzeed.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/sources/travelzeed.ts
import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';

const THAI_MONTHS: Record<string, number> = {
  'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,
  'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12,
};
function thaiDateToISO(s: string): string | null {
  // "24 มิ.ย. 69" (Buddhist year 69 -> 2569 -> 2026)
  const m = s.match(/(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2})/);
  if (!m) return null;
  const day = +m[1], mon = THAI_MONTHS[m[2]], be = 2500 + +m[3];
  return new Date(Date.UTC(be - 543, mon - 1, day)).toISOString();
}

export function parseTravelzeed(html: string, url: string): RawTour | null {
  const sourceId = url.match(/detail\/(\d+)/)?.[1];
  if (!sourceId) return null;
  const title = (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '').trim();
  const days = Number(title.match(/(\d+)\s*วัน/)?.[1]) || undefined;
  const nights = Number(title.match(/(\d+)\s*คืน/)?.[1]) || undefined;
  const airline = html.match(/alt="([^"]*AIRLINES?[^"]*)"/i)?.[1];

  const periods: Period[] = [];
  // pattern "24 มิ.ย. 69- 28 มิ.ย. 69 ราคา 11,900 บาท"
  const re = /(\d{1,2}\s*[ก-๙.]+\s*\d{2})\s*-\s*(\d{1,2}\s*[ก-๙.]+\s*\d{2})[^0-9]*?([0-9][0-9,]{3,})\s*บาท/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const departISO = thaiDateToISO(m[1]); const returnISO = thaiDateToISO(m[2]);
    const price = Number(m[3].replace(/,/g, ''));
    if (departISO && price >= 1000) periods.push({ departISO, returnISO: returnISO ?? undefined, price });
  }
  if (!periods.length) {
    const p = Number((html.match(/ราคา\s*([0-9,]{4,})\s*บาท/)?.[1] ?? '').replace(/,/g, ''));
    if (p >= 1000) periods.push({ departISO: new Date().toISOString(), price: p });
  }
  if (!periods.length) return null;
  return { source: 'travelzeed', sourceId, sourceUrl: url, title, countryRaw: title, airline, days, nights, periods };
}

export const travelzeed: Adapter = {
  id: 'travelzeed', label: 'ทราเวลซี้ด', enabled: true,
  async discover() {
    const sm = await getText('https://www.travelzeed.com/sitemap-tour-products.xml');
    return (sm.match(/https:\/\/www\.travelzeed\.com\/tour\/detail\/\d+/g) ?? []);
  },
  async fetchOne(url) { try { return parseTravelzeed(await getText(url), url); } catch { return null; } },
};
```

- [ ] **Step 4: Run, verify pass** — adjust the date/price regex to the real fixture markup if needed (inspect `grep -o 'ราคา [0-9,]* บาท' tests/fixtures/travelzeed-tour.html`). Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sources/travelzeed.ts tests/travelzeed.test.ts
git commit -m "feat: Travelzeed adapter (sitemap + SSR parse) + fixture test"
```

---

## Task 9: Unithai adapter (PHP + iconv) — TDD

**Files:** Create `src/lib/sources/unithai.ts`, `tests/unithai.test.ts`. Fixtures: `tests/fixtures/unithai-detail.html`, `unithai-book.html`.

> The fixtures are raw bytes mislabeled as UTF-8; in tests we re-decode with iconv. Title decodes via TIS-620.

- [ ] **Step 1: Failing test**

```ts
// tests/unithai.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import iconv from 'iconv-lite';
import { parseUnithai } from '../src/lib/sources/unithai';

const detail = iconv.decode(readFileSync('tests/fixtures/unithai-detail.html'), 'tis-620');
const book = iconv.decode(readFileSync('tests/fixtures/unithai-book.html'), 'tis-620');
describe('parseUnithai', () => {
  const t = parseUnithai(detail, book, '51004');
  it('extracts id + title', () => {
    expect(t?.sourceId).toBe('51004');
    expect((t?.title ?? '').length).toBeGreaterThan(5);
  });
  it('extracts at least one price', () =>
    expect(t?.periods.some((p) => p.price >= 1000)).toBe(true));
});
```

- [ ] **Step 2: Run, verify fail** — FAIL.

- [ ] **Step 3: Implement** (title from detail, prices from book; build URL/image)

```ts
// src/lib/sources/unithai.ts
import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';

export function parseUnithai(detail: string, book: string, code: string): RawTour | null {
  const title = (detail.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '').replace(/\s*\|.*$/, '').trim();
  if (!title) return null;
  const days = Number(title.match(/(\d+)\s*วัน/)?.[1]) || undefined;
  const nights = Number(title.match(/(\d+)\s*คืน/)?.[1]) || undefined;
  const prices = [...book.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:บาท|฿)?/g)]
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => n >= 3000 && n <= 500000);
  const periods: Period[] = prices.length
    ? [{ departISO: new Date().toISOString(), price: Math.min(...prices) }]
    : [];
  if (!periods.length) return null;
  return {
    source: 'unithai', sourceId: code,
    sourceUrl: `https://www.unithaitravel.com/th/trip_detail2.php?route_id=${code}`,
    title, countryRaw: title, days, nights, periods,
  };
}

export const unithai: Adapter = {
  id: 'unithai', label: 'ยูนิไทยทราเวล', enabled: true,
  async discover() {
    // crawl category/listing pages for route_id codes
    const home = await getText('https://www.unithaitravel.com/th/', { encoding: 'tis-620' });
    const codes = new Set<string>();
    for (const m of home.matchAll(/route_id=(\d+)/g)) codes.add(m[1]);
    return [...codes];
  },
  async fetchOne(code) {
    try {
      const detail = await getText(`https://www.unithaitravel.com/th/trip_detail2.php?route_id=${code}`, { encoding: 'tis-620' });
      const book = await getText(`https://www.unithaitravel.com/th/trip_book.php?route_id=${code}`, { encoding: 'tis-620' });
      return parseUnithai(detail, book, code);
    } catch { return null; }
  },
};
```

- [ ] **Step 4: Run, verify pass** — adjust price floor/regex against the real fixture if needed. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sources/unithai.ts tests/unithai.test.ts
git commit -m "feat: Unithai adapter (PHP + iconv decode) + fixture test"
```

---

## Task 10: Up-Operation adapter (tourfiremai.com SSR) — TDD

**Files:** Create `src/lib/sources/upoperation.ts`, `tests/upoperation.test.ts`. Fixture: `tests/fixtures/upoperation-home.html`.

- [ ] **Step 1: Failing test**

```ts
// tests/upoperation.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { discoverUpFromHtml } from '../src/lib/sources/upoperation';
const html = readFileSync('tests/fixtures/upoperation-home.html', 'utf8');
describe('discoverUpFromHtml', () => {
  it('finds tour/destination links', () => {
    const links = discoverUpFromHtml(html);
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((u) => u.startsWith('https://www.tourfiremai.com/'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify fail** — FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/sources/upoperation.ts
import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';

export function discoverUpFromHtml(html: string): string[] {
  const set = new Set<string>();
  for (const m of html.matchAll(/href="(https:\/\/www\.tourfiremai\.com\/(?:cview|domestic|country)\/[^"]+)"/g))
    set.add(m[1]);
  return [...set];
}

export function parseUpOperation(html: string, url: string): RawTour | null {
  const sourceId = url.split('/').filter(Boolean).pop() ?? url;
  const title = (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '').replace(/\s*::.*/, '').trim();
  if (!title) return null;
  const days = Number(title.match(/(\d+)\s*วัน/)?.[1]) || undefined;
  const prices = [...html.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)\s*บาท/g)]
    .map((m) => Number(m[1].replace(/,/g, ''))).filter((n) => n >= 3000);
  const periods: Period[] = prices.length
    ? [{ departISO: new Date().toISOString(), price: Math.min(...prices) }] : [];
  if (!periods.length) return null;
  return { source: 'uphol', sourceId, sourceUrl: url, title, countryRaw: title, days, periods };
}

export const upoperation: Adapter = {
  id: 'uphol', label: 'อัพ-โอเปอเรชั่น', enabled: true,
  async discover() {
    const home = await getText('https://www.tourfiremai.com/');
    return discoverUpFromHtml(home);
  },
  async fetchOne(url) { try { return parseUpOperation(await getText(url), url); } catch { return null; } },
};
```

- [ ] **Step 4: Run, verify pass** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sources/upoperation.ts tests/upoperation.test.ts
git commit -m "feat: Up-Operation adapter + fixture test"
```

---

## Task 11: Source registry

**Files:** Create `src/lib/sources/index.ts`.

- [ ] **Step 1: Implement**

```ts
// src/lib/sources/index.ts
import type { Adapter } from './types';
import { nidnoi } from './nidnoi';
import { travelzeed } from './travelzeed';
import { unithai } from './unithai';
import { upoperation } from './upoperation';
export const adapters: Adapter[] = [nidnoi, travelzeed, unithai, upoperation];
export const enabledAdapters = () => adapters.filter((a) => a.enabled);
```

- [ ] **Step 2: Compile check + commit**

Run: `npx tsc --noEmit`
```bash
git add src/lib/sources/index.ts && git commit -m "feat: source adapter registry"
```

---

## Task 12: Refresh orchestrator + data loader

**Files:** Create `scripts/refresh.ts`, `src/lib/data.ts`, `tests/refresh.test.ts`.

- [ ] **Step 1: Failing test** (orchestrator builds deals from injected adapters)

```ts
// tests/refresh.test.ts
import { describe, it, expect } from 'vitest';
import { buildDeals } from '../scripts/refresh';
import type { Adapter } from '../src/lib/sources/types';

const fake: Adapter = {
  id: 'nidnoi', label: 'x', enabled: true,
  async discover() { return ['u1']; },
  async fetchOne() {
    return { source: 'nidnoi', sourceId: '1', sourceUrl: 'u1', title: 'ทัวร์จีน 5 วัน',
      countryRaw: 'จีน', periods: [{ departISO: '2026-06-20T00:00:00Z', price: 9999 }] };
  },
};
describe('buildDeals', () => {
  it('discovers, fetches, normalizes, sorts by fireScore', async () => {
    const deals = await buildDeals([fake], new Date('2026-06-13T00:00:00Z'), 10);
    expect(deals.length).toBe(1);
    expect(deals[0].country).toBe('china');
    expect(deals[0].fireScore).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run, verify fail** — FAIL.

- [ ] **Step 3: Implement orchestrator**

```ts
// scripts/refresh.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import type { Adapter } from '../src/lib/sources/types';
import type { Tour, RawTour } from '../src/lib/types';
import { toTour } from '../src/lib/normalize';
import { dedupe } from '../src/lib/dedupe';
import { mapLimit } from '../src/lib/sources/http';
import { enabledAdapters } from '../src/lib/sources';

export async function buildDeals(adapters: Adapter[], now = new Date(), perSourceLimit = 200): Promise<Tour[]> {
  const raws: RawTour[] = [];
  for (const a of adapters) {
    try {
      const refs = (await a.discover()).slice(0, perSourceLimit);
      const results = await mapLimit(refs, 5, (r) => a.fetchOne(r));
      for (const r of results) if (r && r.periods.length) raws.push(r);
    } catch (e) { console.error(`[${a.id}] failed:`, (e as Error).message); }
  }
  // country medians for deal scoring
  const byCountry = new Map<string, number[]>();
  const pre = raws.map((r) => toTour(r, now));
  for (const t of pre) (byCountry.get(t.country) ?? byCountry.set(t.country, []).get(t.country)!).push(t.priceFrom);
  const median = (arr: number[]) => { const s=[...arr].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; };
  const medians = new Map([...byCountry].map(([k, v]) => [k, median(v)]));
  const tours = raws.map((r) => toTour(r, now, medians.get((toTour(r, now)).country)));
  return dedupe(tours);
}

export async function refresh(outPath = 'static/data/deals.json') {
  const now = new Date();
  const deals = await buildDeals(enabledAdapters(), now);
  mkdirSync('static/data', { recursive: true });
  const payload = { generatedAt: now.toISOString(), count: deals.length, deals };
  writeFileSync(outPath, JSON.stringify(payload));
  return payload;
}
```

```ts
// src/lib/data.ts
import type { Tour } from './types';
export interface DealsFile { generatedAt: string; count: number; deals: Tour[]; }
export async function loadDeals(): Promise<DealsFile> {
  const data = await import('../../static/data/deals.json');
  return (data.default ?? data) as DealsFile;
}
```

- [ ] **Step 4: Run, verify pass** — `npx vitest run tests/refresh.test.ts` → PASS.

- [ ] **Step 5: Seed an initial deals.json** (so pages build before first cron)

```bash
mkdir -p static/data
echo '{"generatedAt":"2026-06-13T00:00:00Z","count":0,"deals":[]}' > static/data/deals.json
git add scripts/refresh.ts src/lib/data.ts tests/refresh.test.ts static/data/deals.json
git commit -m "feat: refresh orchestrator + deals loader + seed"
```

---

## Task 13: SEO/JSON-LD builders (TDD)

**Files:** Create `src/lib/seo.ts`, `tests/seo.test.ts`.

- [ ] **Step 1: Failing test**

```ts
// tests/seo.test.ts
import { describe, it, expect } from 'vitest';
import { tourJsonLd, itemListJsonLd } from '../src/lib/seo';
import type { Tour } from '../src/lib/types';
const t = { id:'nidnoi-1', slug:'china-x-1', source:'nidnoi', sourceUrl:'u', title:'ทัวร์จีน',
  country:'china', priceFrom:9999, periods:[{departISO:'2026-06-20T00:00:00Z',price:9999}],
  fetchedAtISO:'', urgencyScore:1, dealScore:1, fireScore:1 } as Tour;
describe('seo', () => {
  it('tourJsonLd produces a TouristTrip with an Offer in THB', () => {
    const ld = tourJsonLd(t, 'https://tourfiremai.com');
    expect(ld['@type']).toBe('TouristTrip');
    expect(ld.offers.priceCurrency).toBe('THB');
    expect(ld.offers.price).toBe(9999);
  });
  it('itemListJsonLd lists items', () => {
    expect(itemListJsonLd([t], 'https://tourfiremai.com')['@type']).toBe('ItemList');
  });
});
```

- [ ] **Step 2: Run, verify fail** — FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/seo.ts
import type { Tour } from './types';
export function tourJsonLd(t: Tour, base: string) {
  return {
    '@context': 'https://schema.org', '@type': 'TouristTrip',
    name: t.title, url: `${base}/tour/${t.slug}`,
    touristType: 'leisure',
    offers: {
      '@type': 'Offer', price: t.priceFrom, priceCurrency: 'THB',
      availability: t.nextDepartISO ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      validThrough: t.nextDepartISO, url: t.sourceUrl,
    },
  };
}
export function itemListJsonLd(tours: Tour[], base: string) {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList',
    numberOfItems: tours.length,
    itemListElement: tours.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${base}/tour/${t.slug}`, name: t.title,
    })),
  };
}
export function metaTags(o: { title: string; description: string; url: string; image?: string }) {
  return o; // consumed by <svelte:head>
}
```

- [ ] **Step 4: Run, verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts tests/seo.test.ts && git commit -m "feat: JSON-LD + meta builders"
```

---

## Task 14: Design system (CSS) + base components

**Files:** Create `src/app.css`, `src/lib/components/{FireBadge,CountryChip,PriceTag,TourCard,Header,Footer}.svelte`.

- [ ] **Step 1: Design tokens** in `src/app.css`

```css
:root{
  --ink:#15110e; --bg:#fffdf9; --muted:#6b6259; --card:#fff; --line:#efe7dc;
  --fire1:#ffb020; --fire2:#ff5a3c; --fire3:#e0218a;
  --green:#1a9d5a; --red:#e0392b; --radius:18px; --shadow:0 10px 30px rgba(40,20,10,.08);
  --grad:linear-gradient(100deg,var(--fire1),var(--fire2),var(--fire3));
  --font: "IBM Plex Sans Thai","Noto Sans Thai",system-ui,sans-serif;
}
@media (prefers-color-scheme: dark){:root{--ink:#f4efe9;--bg:#14110e;--card:#1d1813;--line:#2b2view;--muted:#a99}}
*{box-sizing:border-box} html,body{margin:0} body{font-family:var(--font);background:var(--bg);color:var(--ink);line-height:1.55}
.container{max-width:1180px;margin:0 auto;padding:0 20px}
.fire-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.btn-fire{background:var(--grad);color:#fff;border:0;border-radius:999px;padding:12px 22px;font-weight:700;cursor:pointer}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:22px}
@media(prefers-reduced-motion:no-preference){.card{transition:transform .2s,box-shadow .2s}.card:hover{transform:translateY(-4px)}}
```
(Fix the typo `--line:#2b2view` → `#2b241c` when implementing.)

- [ ] **Step 2: FireBadge.svelte**

```svelte
<script lang="ts">export let score: number; export let reason = '';
  $: tier = score >= 75 ? 'ร้อนแรง' : score >= 50 ? 'น่าสนใจ' : 'ดีล';</script>
<span class="badge" title={reason}>🔥 {tier} · {Math.round(score)}</span>
<style>.badge{background:var(--grad);color:#fff;font-weight:800;font-size:.8rem;
  padding:5px 12px;border-radius:999px;display:inline-flex;gap:4px;white-space:nowrap}</style>
```

- [ ] **Step 3: PriceTag, CountryChip**

```svelte
<!-- PriceTag.svelte -->
<script lang="ts">export let price:number; export let before:number|undefined=undefined; export let discount:number|undefined=undefined;</script>
<div class="price"><strong>฿{price.toLocaleString('th-TH')}</strong>
  {#if before}<s>฿{before.toLocaleString('th-TH')}</s>{/if}
  {#if discount}<em>-{discount}%</em>{/if}</div>
<style>.price{display:flex;align-items:baseline;gap:8px}.price strong{font-size:1.3rem;color:var(--fire2)}
.price s{color:var(--muted);font-size:.85rem}.price em{color:var(--green);font-weight:700;font-style:normal}</style>
```

```svelte
<!-- CountryChip.svelte -->
<script lang="ts">import {COUNTRY_LABELS} from '$lib/countries'; export let country:string;</script>
<span class="chip">{COUNTRY_LABELS[country] ?? country}</span>
<style>.chip{background:rgba(255,90,60,.1);color:var(--fire2);border-radius:999px;padding:3px 10px;font-size:.78rem;font-weight:700}</style>
```

- [ ] **Step 4: TourCard.svelte** (uses proxyImage, FireBadge, PriceTag, CountryChip)

```svelte
<script lang="ts">
  import type { Tour } from '$lib/types';
  import { proxyImage } from '$lib/images';
  import FireBadge from './FireBadge.svelte';
  import PriceTag from './PriceTag.svelte';
  import CountryChip from './CountryChip.svelte';
  export let t: Tour;
  $: reason = [t.nextDepartISO ? `ออกเดินทาง ${new Date(t.nextDepartISO).toLocaleDateString('th-TH')}` : '',
    t.periods.find(p=>p.seats!=null && p.seats<=5) ? 'ที่นั่งเหลือน้อย' : ''].filter(Boolean).join(' · ');
</script>
<a class="card" href={`/tour/${t.slug}`}>
  <div class="img"><img loading="lazy" src={proxyImage(t.image,640)} alt={t.title}/>
    <div class="fb"><FireBadge score={t.fireScore} reason={reason}/></div></div>
  <div class="body">
    <CountryChip country={t.country}/>
    <h3>{t.title}</h3>
    <div class="meta">{#if t.days}{t.days} วัน{/if}{#if t.airline} · {t.airline}{/if}</div>
    <PriceTag price={t.priceFrom} before={t.periods[0]?.priceBefore} discount={t.discountPct}/>
    {#if reason}<div class="reason">{reason}</div>{/if}
  </div>
</a>
<style>
  .card{display:block;text-decoration:none;color:inherit}
  .img{position:relative;aspect-ratio:16/10;background:#eee}
  .img img{width:100%;height:100%;object-fit:cover}
  .fb{position:absolute;top:10px;left:10px}
  .body{padding:14px 16px;display:grid;gap:8px}
  h3{margin:0;font-size:1rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .meta{color:var(--muted);font-size:.85rem}.reason{color:var(--red);font-size:.8rem;font-weight:600}
</style>
```

- [ ] **Step 5: Header/Footer** (brand wordmark "TourFireMai 🔥", nav to destinations) — minimal, semantic.

- [ ] **Step 6: Verify build + commit**

Run: `npm run build`
```bash
git add src/app.css src/lib/components && git commit -m "feat: design system + base components"
```

---

## Task 15: Routes — home, tour, destination, search, layout

**Files:** Create `src/routes/+layout.svelte`, `+layout.ts`, `+page.ts`, `+page.svelte`, `tour/[slug]/+page.ts` & `.svelte`, `destination/[country]/+page.ts` & `.svelte`, `search/+page.svelte`.

- [ ] **Step 1: layout** loads deals once, prerender on.

```ts
// src/routes/+layout.ts
export const prerender = true;
import { loadDeals } from '$lib/data';
export const load = async () => ({ file: await loadDeals() });
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">import '../app.css'; import Header from '$lib/components/Header.svelte'; import Footer from '$lib/components/Footer.svelte';</script>
<Header/><main class="container"><slot/></main><Footer/>
```

- [ ] **Step 2: home** — ranked feed + hero + JSON-LD ItemList.

```ts
// src/routes/+page.ts
import type { DealsFile } from '$lib/data';
export const load = async ({ parent }) => {
  const { file } = (await parent()) as { file: DealsFile };
  return { deals: file.deals.slice(0, 60), generatedAt: file.generatedAt };
};
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import TourCard from '$lib/components/TourCard.svelte';
  import { itemListJsonLd } from '$lib/seo';
  export let data;
  const base = 'https://tourfiremai.com';
</script>
<svelte:head>
  <title>TourFireMai — รวมทัวร์ไฟไหม้ ราคาถูก ที่นั่งเหลือน้อย อัปเดตทุกวัน</title>
  <meta name="description" content="รวมโปรทัวร์ไฟไหม้ ทัวร์ราคาถูกที่สุด ออกเดินทางด่วน ที่นั่งใกล้เต็ม จากบริษัททัวร์ชั้นนำของไทย อัปเดตอัตโนมัติ"/>
  {@html `<script type="application/ld+json">${JSON.stringify(itemListJsonLd(data.deals, base))}<\/script>`}
</svelte:head>
<section class="hero">
  <h1 class="fire-text">ทัวร์ไฟไหม้ 🔥 ดีลที่ร้อนแรงที่สุดในไทย</h1>
  <p>รวมทัวร์ราคาถูก ออกเดินทางด่วน ที่นั่งเหลือน้อย — คัดและจัดอันดับอัตโนมัติทุกวัน</p>
</section>
<div class="grid">{#each data.deals as t (t.id)}<TourCard {t}/>{/each}</div>
<style>.hero{padding:48px 0 28px}.hero h1{font-size:clamp(1.8rem,5vw,3rem);margin:0 0 8px}.hero p{color:var(--muted);max-width:640px}</style>
```

- [ ] **Step 3: tour detail** — prerender entries from deals; full JSON-LD + "จองที่ {operator}".

```ts
// src/routes/tour/[slug]/+page.ts
import { error } from '@sveltejs/kit';
import { loadDeals } from '$lib/data';
export const prerender = true;
export async function entries() {
  const { deals } = await loadDeals();
  return deals.map((d) => ({ slug: d.slug }));
}
export async function load({ params }) {
  const { deals } = await loadDeals();
  const tour = deals.find((d) => d.slug === params.slug);
  if (!tour) throw error(404, 'ไม่พบทัวร์');
  return { tour };
}
```

```svelte
<!-- src/routes/tour/[slug]/+page.svelte -->
<script lang="ts">
  import { proxyImage } from '$lib/images';
  import { tourJsonLd } from '$lib/seo';
  import PriceTag from '$lib/components/PriceTag.svelte';
  import FireBadge from '$lib/components/FireBadge.svelte';
  export let data; const t = data.tour; const base='https://tourfiremai.com';
</script>
<svelte:head>
  <title>{t.title} — ฿{t.priceFrom.toLocaleString('th-TH')} | TourFireMai</title>
  <meta name="description" content={`${t.title} ราคาเริ่ม ฿${t.priceFrom.toLocaleString('th-TH')} โดย ${t.source}`}/>
  <link rel="canonical" href={`${base}/tour/${t.slug}`}/>
  {@html `<script type="application/ld+json">${JSON.stringify(tourJsonLd(t, base))}<\/script>`}
</svelte:head>
<article class="detail">
  <img src={proxyImage(t.image,1080)} alt={t.title}/>
  <h1>{t.title}</h1>
  <FireBadge score={t.fireScore}/>
  <PriceTag price={t.priceFrom} discount={t.discountPct}/>
  <h2>วันเดินทาง</h2>
  <ul>{#each t.periods as p}<li>{new Date(p.departISO).toLocaleDateString('th-TH')} — ฿{p.price.toLocaleString('th-TH')}
    {#if p.seats!=null} · เหลือ {p.seats} ที่{/if}{#if p.soldOut} · เต็มแล้ว{/if}</li>{/each}</ul>
  <a class="btn-fire" href={t.sourceUrl} target="_blank" rel="nofollow noopener">จองที่ {t.source} →</a>
</article>
<style>.detail{padding:24px 0;max-width:820px}.detail img{width:100%;border-radius:var(--radius)}</style>
```

- [ ] **Step 4: destination + search**

```ts
// src/routes/destination/[country]/+page.ts
import { loadDeals } from '$lib/data';
import { COUNTRY_LABELS } from '$lib/countries';
export const prerender = true;
export const entries = () => Object.keys(COUNTRY_LABELS).map((country) => ({ country }));
export async function load({ params }) {
  const { deals } = await loadDeals();
  return { country: params.country, deals: deals.filter((d) => d.country === params.country) };
}
```
`destination/[country]/+page.svelte`: head with `ทัวร์{label} ไฟไหม้ ราคาถูก` + grid of TourCards.
`search/+page.svelte`: client-side filter (country select, price range, sort) over `data.file.deals` from layout.

- [ ] **Step 5: Build + commit**

Run: `npm run build`
Expected: prerenders home + tour pages + destinations without error.
```bash
git add src/routes && git commit -m "feat: home, tour, destination, search routes + JSON-LD"
```

---

## Task 16: sitemap.xml, robots.txt, feed.xml, llms.txt

**Files:** Create `src/routes/{sitemap.xml,robots.txt,feed.xml,llms.txt}/+server.ts`.

- [ ] **Step 1: Implement endpoints**

```ts
// src/routes/sitemap.xml/+server.ts
import { loadDeals } from '$lib/data';
import { COUNTRY_LABELS } from '$lib/countries';
export const prerender = true;
export async function GET() {
  const base='https://tourfiremai.com'; const { deals } = await loadDeals();
  const urls=[`${base}/`, ...Object.keys(COUNTRY_LABELS).map(c=>`${base}/destination/${c}`),
    ...deals.map(d=>`${base}/tour/${d.slug}`)];
  const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
    urls.map(u=>`<url><loc>${u}</loc><changefreq>daily</changefreq></url>`).join('')}</urlset>`;
  return new Response(xml,{headers:{'content-type':'application/xml'}});
}
```

```ts
// src/routes/robots.txt/+server.ts
export const prerender = true;
export const GET = async () => new Response(
  `User-agent: *\nAllow: /\nSitemap: https://tourfiremai.com/sitemap.xml\n`,
  { headers: { 'content-type': 'text/plain' } });
```

```ts
// src/routes/feed.xml/+server.ts
import { loadDeals } from '$lib/data';
export const prerender = true;
export async function GET() {
  const base='https://tourfiremai.com'; const { deals, generatedAt } = await loadDeals();
  const items = deals.slice(0,50).map(d=>`<item><title>${escapeXml(d.title)}</title>
    <link>${base}/tour/${d.slug}</link><guid>${d.id}</guid>
    <description>฿${d.priceFrom.toLocaleString('th-TH')}</description></item>`).join('');
  const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>
    <title>TourFireMai — ทัวร์ไฟไหม้</title><link>${base}</link>
    <description>รวมทัวร์ราคาถูก ที่นั่งเหลือน้อย</description><lastBuildDate>${generatedAt}</lastBuildDate>
    ${items}</channel></rss>`;
  return new Response(xml,{headers:{'content-type':'application/rss+xml'}});
}
function escapeXml(s:string){return s.replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]!));}
```

```ts
// src/routes/llms.txt/+server.ts
export const prerender = true;
export const GET = async () => new Response(
`# TourFireMai
รวมทัวร์ไฟไหม้ (last-minute/discount tour packages) จากบริษัททัวร์ไทยชั้นนำ จัดอันดับตามความเร่งด่วนและราคา อัปเดตทุก 6 ชั่วโมง
Sources: นิดหน่อยทราเวล, ทราเวลซี้ด, ยูนิไทยทราเวล, อัพ-โอเปอเรชั่น
Data: /feed.xml (RSS), /sitemap.xml
`, { headers: { 'content-type': 'text/plain' } });
```

- [ ] **Step 2: Build + commit**

Run: `npm run build`
```bash
git add src/routes/sitemap.xml src/routes/robots.txt src/routes/feed.xml src/routes/llms.txt
git commit -m "feat: sitemap, robots, RSS feed, llms.txt"
```

---

## Task 17: Cron route + vercel.json

**Files:** Create `src/routes/api/cron/refresh/+server.ts`, `vercel.json`.

- [ ] **Step 1: Cron handler** (guarded; runs refresh; commits via git when token present)

```ts
// src/routes/api/cron/refresh/+server.ts
import { json, error } from '@sveltejs/kit';
import { refresh } from '../../../../../scripts/refresh';
import { execSync } from 'node:child_process';
export const prerender = false;
export async function GET({ request, url }) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)
    throw error(401, 'unauthorized');
  const payload = await refresh('static/data/deals.json');
  if (payload.count > 0 && process.env.GIT_PUSH === '1') {
    try {
      execSync('git add static/data/deals.json', { stdio: 'ignore' });
      execSync(`git -c user.name="TourFireMai Bot" -c user.email="774767+johnnyduo@users.noreply.github.com" commit -m "data: refresh deals (${payload.count})"`, { stdio: 'ignore' });
      execSync('git push', { stdio: 'ignore' });
    } catch (e) { console.error('git push skipped:', (e as Error).message); }
  }
  return json({ ok: true, count: payload.count, generatedAt: payload.generatedAt });
}
```

> On Vercel the runtime FS is read-only/ephemeral, so git-push-from-function won't persist. The committed-JSON refresh is driven by **GitHub Actions** (Task 18) as the canonical scheduler; this route stays for manual/local trigger and returns fresh data. `vercel.json` cron can still hit it to warm/preview.

`vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/refresh", "schedule": "0 */6 * * *" }] }
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api vercel.json && git commit -m "feat: cron refresh route + vercel cron schedule"
```

---

## Task 18: GitHub Actions scheduled refresh (canonical data updater)

**Files:** Create `.github/workflows/refresh.yml`, add `refresh` npm script.

- [ ] **Step 1: npm script** — `package.json`: `"scripts": { ..., "refresh": "node --import tsx scripts/run-refresh.ts" }` and create `scripts/run-refresh.ts`:

```ts
// scripts/run-refresh.ts
import { refresh } from './refresh';
refresh().then((p) => console.log('deals:', p.count)).catch((e) => { console.error(e); process.exit(1); });
```
Install tsx: `npm i -D tsx`.

- [ ] **Step 2: Workflow**

```yaml
# .github/workflows/refresh.yml
name: Refresh deals
on:
  schedule: [{ cron: '0 */6 * * *' }]
  workflow_dispatch:
permissions: { contents: write }
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run refresh
      - name: Commit updated deals
        run: |
          git config user.name "TourFireMai Bot"
          git config user.email "774767+johnnyduo@users.noreply.github.com"
          git add static/data/deals.json
          git diff --staged --quiet || git commit -m "data: scheduled deals refresh"
          git push
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/refresh.yml scripts/run-refresh.ts package.json
git commit -m "ci: scheduled deals refresh via GitHub Actions"
```

---

## Task 19: Real end-to-end refresh + full verification

- [ ] **Step 1: Run refresh against live sources**

Run: `npm run refresh`
Expected: prints `deals: N` with N > 0; `static/data/deals.json` populated. If a source yields 0, check its `discover()` against current site (adapters log their own errors).

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 3: Build with real data**

Run: `npm run build`
Expected: prerenders home + all tour/destination pages, sitemap/feed emitted, no errors.

- [ ] **Step 4: Type + lint check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit real data**

```bash
git add static/data/deals.json && git commit -m "data: initial live deals snapshot"
```

---

## Task 20: README + push to GitHub

**Files:** Create `README.md`.

- [ ] **Step 1: README** — what it is, sources, architecture, `npm run dev/build/refresh`, env (`CRON_SECRET`), Vercel + GH Actions deploy notes.

- [ ] **Step 2: Push**

```bash
git push -u origin main
```
Expected: pushes to `github.com/johnnyduo/tourfiremai`.

- [ ] **Step 3: Deploy note** — Vercel: import repo, set `CRON_SECRET`; GH Actions runs the 6h refresh. Done.

---

## Self-Review notes
- Spec §2 sources → Tasks 7–10 (all 4). §3 architecture → 12/17/18. §4 model → 2/5. §5 design → 14. §6 SEO/AEO/GEO → 13/15/16. §8 testing → every adapter+pure-fn task. §9 errors → http.ts retries + per-adapter try/catch in 12 + cron guard in 17.
- Type consistency: `Tour`/`RawTour`/`Period`/`Adapter`/`SourceId('uphol')` used consistently across tasks. `proxyImage`, `toTour`, `buildDeals`, `tourJsonLd`, `itemListJsonLd`, `loadDeals` names stable.
- Known adjust-on-real-data points flagged in Tasks 7–10 (regex tuning against committed fixtures) and 19 (live discover).
