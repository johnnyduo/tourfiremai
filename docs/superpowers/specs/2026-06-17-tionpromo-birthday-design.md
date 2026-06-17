# TionPromo umbrella + โปรเดือนเกิด (birthday promos) — Design

Date: 2026-06-17
Status: Approved (navigation + scope confirmed)

## Goal

Re-position the existing SvelteKit site as **TionPromo (ชั่นโปรโม)**, an umbrella
promotions brand, with two sub-sections:

- 🔥 **ทัวร์ไฟไหม้** — the existing last-minute tour-deal aggregator (logic untouched).
- 🎂 **โปรเดือนเกิด** — Thai brand birthday-month promos (new section).

Constraints: keep the static-prerender model, keep build/refresh pipeline intact,
fast (no new runtime scraping), accurate data.

## Decisions (from brainstorming)

1. **Positioning** — TionPromo = umbrella brand. ทัวร์ไฟไหม้ + โปรเดือนเกิด are sub-sections,
   one domain (`tourfiremai.com` unchanged), one codebase.
2. **Birthday data source** — curated static JSON seed built now via deep research;
   a manual edit flow (just editing the JSON) is the "tool" for now. No scraping pipeline.
3. **Month model** — **both views with a toggle**:
   - default *birth-month view* (`เดือนเกิดฉัน`): evergreen perks + month-specific perks valid in the selected month.
   - *this-calendar-month view* (`โปรเดือนนี้`): only promos whose campaign is dated to the selected calendar month.
4. **Datetime tracking** — auto-select the current calendar month tab on load
   (`today` detected client-side), updating each month with no redeploy.
5. **Research scope** — start from the screenshot (~50 brands), deep-research to
   expand to ~100+ TH birthday promos across categories.

## Brand / config

- Add `src/lib/site.ts` exporting `SITE = { name: 'TionPromo', nameTh: 'ชั่นโปรโม', tagline, base }`
  so the brand name is swappable in one place. `base` stays `https://tourfiremai.com`.
- Header brand text → `TionPromo`. Footer, Organization/WebSite JSON-LD, page `<title>`s
  reference TionPromo, with ทัวร์ไฟไหม้ described as a sub-brand.

## Navigation

Header (left→right): brand `TionPromo` · `🔥 ทัวร์ไฟไหม้` (`/`) · `🎂 โปรเดือนเกิด` (`/birthday`) ·
existing destination links · ค้นหา · theme toggle. Active section highlighted via `$page.url.pathname`.

Homepage `/` gains a slim promo strip linking to `/birthday` so the umbrella is visible;
the tour-deal grid and its SEO are otherwise unchanged.

## Birthday data model

`src/lib/birthday/types.ts`:

```ts
export type PromoCategory = 'drinks' | 'food' | 'cosmetic' | 'entertainment' | 'shopping' | 'bank' | 'other';
export type PromoChannel = 'line' | 'app' | 'web' | 'instore' | 'card' | 'event';

export interface BirthdayPromo {
  id: string;            // kebab brand+seq, stable
  brand: string;         // display name (EN or TH as published)
  category: PromoCategory;
  channel: PromoChannel; // primary redemption channel
  channelLabel?: string; // e.g. "UOB Simple", "Aeon M Gen" when channel doesn't capture it
  condition?: string;    // e.g. "ระดับ Gold", "เคยซื้อ", "ยอด 150 บาท"
  perk: string;          // the reward text (Thai)
  evergreen: boolean;    // true = valid in your birth month year-round
  months?: number[];     // 1-12; for non-evergreen / campaign-dated promos
  validUntilISO?: string;// optional hard expiry for dated campaigns
  url?: string;          // brand link / signup if known
  note?: string;         // tier nuance, value, etc.
}
```

`static/data/birthday.json`:

```ts
{ generatedAt: string; count: number; promos: BirthdayPromo[] }
```

Notes:
- **Evergreen** promos appear in the birth-month view for every month.
- **Calendar-month view** shows promos where `months` includes the selected month
  (evergreen promos are excluded from this view unless they also carry `months`).
- Category order & Thai labels mirror the screenshot sections
  (เครื่องดื่ม/ขนม, ของกิน, Cosmetic, อื่นๆ → mapped to the enum above).

## Loader & helpers

- `src/lib/birthday/data.ts` — `loadBirthday()` imports the JSON (mirrors `data.ts`).
- `src/lib/birthday/select.ts` — pure functions:
  - `currentMonth(now: Date): number`
  - `promosForBirthMonth(promos, month): BirthdayPromo[]` (evergreen ∪ months.includes(month))
  - `promosForCalendarMonth(promos, month): BirthdayPromo[]` (months.includes(month), not expired vs a passed-in `now`)
  - `groupByCategory(promos): Array<{category, label, items}>` in fixed category order
  These are unit-tested (no DOM, deterministic given inputs).

## Routes / components

- `src/routes/birthday/+page.ts` — `prerender = true`; loads `loadBirthday()`,
  returns `{ promos, generatedAt }`. (Month selection + view toggle are client-side so
  the page stays a single prerendered document; current-month auto-select happens on mount.)
- `src/routes/birthday/+page.svelte`:
  - Hero: 🎂 โปรเดือนเกิด heading + short copy + `อัปเดต <generatedAt>`.
  - View toggle: `( ) เดือนเกิดฉัน  ( ) โปรเดือนนี้`.
  - Month tabs Jan→Dec (Thai short names + พ.ศ. year), current month preselected on mount.
  - Category sections, each a grid of `BirthdayCard`s.
  - FAQ (โปรเดือนเกิดคืออะไร / รับสิทธิ์อย่างไร) + FAQ JSON-LD.
- `src/lib/components/BirthdayCard.svelte` — brand, perk, channel chip, condition, note.
  Reuses `.card`, `.grid`, theme vars, chip styling from existing components.
- `src/lib/components/MonthTabs.svelte` — horizontally scrollable month selector.

## SEO / discovery

- `/birthday` added to `sitemap.xml` and `llms.txt` (new section describing โปรเดือนเกิด).
- `robots.txt` unchanged (allows `/birthday` under default Allow).
- Page-level meta: Thai title/description targeting "โปรเดือนเกิด 2026 / ส่วนลดวันเกิด".
- FAQPage + Breadcrumb JSON-LD on `/birthday`.

## Testing

- `tests/birthday.test.ts`:
  - `currentMonth` maps a known date to the right month.
  - `promosForBirthMonth` includes all evergreen + the month-specific ones; excludes other-month-only.
  - `promosForCalendarMonth` excludes evergreen-without-months and expired-dated promos.
  - `groupByCategory` returns fixed order and drops empty categories.
  - `birthday.json` integrity: unique ids, valid category/channel enums, months in 1..12,
    evergreen-or-months present.
- Existing suites must stay green (no changes to tour logic).

## Out of scope (later)

- Admin UI / CMS for editing promos (JSON edit is the current flow).
- Per-promo countdown badges and validity-date hiding (datetime = auto current-month only for now).
- Domain rename / TionPromo domain.
- Individual `/birthday/[brand]` detail pages.

## Risk notes

- Birthday-promo terms change frequently and vary by tier; JSON is a best-effort snapshot,
  `perk`/`condition` kept short and the page shows an "อัปเดต <date> · ยืนยันกับร้านค้า" disclaimer.
- Deep-research expansion (~100+) carries accuracy risk; uncertain entries get a conservative
  `condition`/`note` and only well-attested perks are included. Silent gaps are acceptable
  (curated, not exhaustive) and stated in copy.
