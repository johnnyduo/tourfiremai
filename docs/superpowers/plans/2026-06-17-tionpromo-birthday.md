# TionPromo umbrella + โปรเดือนเกิด Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-brand the site as TionPromo (umbrella) with ทัวร์ไฟไหม้ and a new โปรเดือนเกิด (birthday promos) sub-section, seeded by a curated TH 2026 birthday-promo JSON.

**Architecture:** Keep the static-prerendered SvelteKit app and tour-deal logic untouched. Add a `SITE` config constant for the swappable brand name, a `birthday/` lib (types, loader, pure selection helpers), a static `birthday.json` data file, a prerendered `/birthday` route with client-side month tabs + view toggle, and supporting cards. Wire SEO (sitemap, llms.txt, JSON-LD).

**Tech Stack:** SvelteKit 2 (Svelte 4), TypeScript, Vitest, static JSON import, Vercel adapter.

## Global Constraints

- Brand display name lives only in `src/lib/site.ts` (`SITE.name = 'TionPromo'`); no hardcoded "TionPromo" elsewhere.
- `base` stays `https://tourfiremai.com` (no domain change).
- All new pages `export const prerender = true;` (matches existing routes).
- No new runtime network/scraping; birthday data is static JSON.
- Tour-deal logic and its tests must remain unchanged and green.
- Thai UI copy; category order: drinks, food, cosmetic, entertainment, shopping, bank, other.
- Selection helpers must be pure (no `Date.now()` inside — pass `now`/`month` in) so they're testable.

---

### Task 1: SITE config constant

**Files:**
- Create: `src/lib/site.ts`
- Test: `tests/site.test.ts`

**Interfaces:**
- Produces: `SITE: { name: string; nameTh: string; tagline: string; base: string }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/site.test.ts
import { describe, it, expect } from 'vitest';
import { SITE } from '../src/lib/site';

describe('SITE', () => {
  it('exposes brand identity and base url', () => {
    expect(SITE.name).toBe('TionPromo');
    expect(SITE.nameTh).toBe('ชั่นโปรโม');
    expect(SITE.base).toBe('https://tourfiremai.com');
    expect(typeof SITE.tagline).toBe('string');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tests/site.test.ts`
Expected: FAIL (cannot find module `../src/lib/site`)

- [ ] **Step 3: Implement**

```ts
// src/lib/site.ts
export const SITE = {
  name: 'TionPromo',
  nameTh: 'ชั่นโปรโม',
  tagline: 'รวมโปรโมชันเด็ด ทัวร์ไฟไหม้ และโปรเดือนเกิด อัปเดตทุกวัน',
  base: 'https://tourfiremai.com'
} as const;
```

- [ ] **Step 4: Run test, verify pass**

Run: `npx vitest run tests/site.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts tests/site.test.ts
git commit -m "feat: add SITE brand config constant"
```

---

### Task 2: Birthday types

**Files:**
- Create: `src/lib/birthday/types.ts`

**Interfaces:**
- Produces: `PromoCategory`, `PromoChannel`, `BirthdayPromo`, `BirthdayFile` types; `CATEGORY_ORDER`, `CATEGORY_LABELS`, `CHANNEL_LABELS`.

- [ ] **Step 1: Implement (types-only, no test needed — exercised by Task 3+ tests)**

```ts
// src/lib/birthday/types.ts
export type PromoCategory =
  | 'drinks' | 'food' | 'cosmetic' | 'entertainment' | 'shopping' | 'bank' | 'other';
export type PromoChannel = 'line' | 'app' | 'web' | 'instore' | 'card' | 'event';

export interface BirthdayPromo {
  id: string;
  brand: string;
  category: PromoCategory;
  channel: PromoChannel;
  channelLabel?: string;
  condition?: string;
  perk: string;
  evergreen: boolean;
  months?: number[];        // 1-12
  validUntilISO?: string;
  url?: string;
  note?: string;
}

export interface BirthdayFile {
  generatedAt: string;
  count: number;
  promos: BirthdayPromo[];
}

export const CATEGORY_ORDER: PromoCategory[] = [
  'drinks', 'food', 'cosmetic', 'entertainment', 'shopping', 'bank', 'other'
];

export const CATEGORY_LABELS: Record<PromoCategory, string> = {
  drinks: 'เครื่องดื่ม / ขนม',
  food: 'ของกิน',
  cosmetic: 'เครื่องสำอาง / ความงาม',
  entertainment: 'บันเทิง / ท่องเที่ยว',
  shopping: 'ช้อปปิ้ง',
  bank: 'ธนาคาร / บัตรเครดิต',
  other: 'อื่นๆ'
};

export const CHANNEL_LABELS: Record<PromoChannel, string> = {
  line: 'LINE',
  app: 'App',
  web: 'Web',
  instore: 'หน้าร้าน',
  card: 'บัตรเครดิต',
  event: 'หน้างาน'
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/birthday/types.ts
git commit -m "feat: birthday promo types and label maps"
```

---

### Task 3: Selection helpers (pure, TDD)

**Files:**
- Create: `src/lib/birthday/select.ts`
- Test: `tests/birthday-select.test.ts`

**Interfaces:**
- Consumes: `BirthdayPromo`, `PromoCategory`, `CATEGORY_ORDER`, `CATEGORY_LABELS` from `./types`.
- Produces:
  - `currentMonth(now: Date): number` (1-12)
  - `promosForBirthMonth(promos: BirthdayPromo[], month: number): BirthdayPromo[]`
  - `promosForCalendarMonth(promos: BirthdayPromo[], month: number, now: Date): BirthdayPromo[]`
  - `groupByCategory(promos: BirthdayPromo[]): Array<{ category: PromoCategory; label: string; items: BirthdayPromo[] }>`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/birthday-select.test.ts
import { describe, it, expect } from 'vitest';
import {
  currentMonth, promosForBirthMonth, promosForCalendarMonth, groupByCategory
} from '../src/lib/birthday/select';
import type { BirthdayPromo } from '../src/lib/birthday/types';

const p = (over: Partial<BirthdayPromo>): BirthdayPromo => ({
  id: over.id ?? 'x', brand: 'B', category: over.category ?? 'drinks',
  channel: 'line', perk: 'free', evergreen: over.evergreen ?? false, ...over
});

const promos: BirthdayPromo[] = [
  p({ id: 'ever', evergreen: true, category: 'drinks' }),
  p({ id: 'jun-only', evergreen: false, months: [6], category: 'food' }),
  p({ id: 'jan-only', evergreen: false, months: [1], category: 'food' }),
  p({ id: 'ever-jun', evergreen: true, months: [6], category: 'cosmetic' }),
  p({ id: 'expired-jun', evergreen: false, months: [6], validUntilISO: '2026-06-10', category: 'food' })
];

describe('currentMonth', () => {
  it('returns 1-based month', () => {
    expect(currentMonth(new Date('2026-06-17T00:00:00Z'))).toBe(6);
    expect(currentMonth(new Date('2026-01-02T00:00:00Z'))).toBe(1);
  });
});

describe('promosForBirthMonth', () => {
  it('includes all evergreen plus month-specific for that month', () => {
    const ids = promosForBirthMonth(promos, 6).map((x) => x.id);
    expect(ids).toContain('ever');
    expect(ids).toContain('ever-jun');
    expect(ids).toContain('jun-only');
    expect(ids).toContain('expired-jun'); // birth-month view ignores expiry
    expect(ids).not.toContain('jan-only');
  });
  it('evergreen still shows in a month with no specific promos', () => {
    const ids = promosForBirthMonth(promos, 3).map((x) => x.id);
    expect(ids).toEqual(['ever', 'ever-jun']);
  });
});

describe('promosForCalendarMonth', () => {
  const now = new Date('2026-06-17T00:00:00Z');
  it('only month-dated promos, excludes pure evergreen, excludes expired', () => {
    const ids = promosForCalendarMonth(promos, 6, now).map((x) => x.id);
    expect(ids).toContain('jun-only');
    expect(ids).toContain('ever-jun'); // evergreen but carries months:[6]
    expect(ids).not.toContain('ever'); // pure evergreen, no months
    expect(ids).not.toContain('expired-jun'); // past validUntil
    expect(ids).not.toContain('jan-only');
  });
});

describe('groupByCategory', () => {
  it('returns fixed order and drops empty categories', () => {
    const groups = groupByCategory(promosForBirthMonth(promos, 6));
    expect(groups.map((g) => g.category)).toEqual(['drinks', 'food', 'cosmetic']);
    expect(groups[0].label).toBe('เครื่องดื่ม / ขนม');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/birthday-select.test.ts`
Expected: FAIL (cannot find module `select`)

- [ ] **Step 3: Implement**

```ts
// src/lib/birthday/select.ts
import type { BirthdayPromo, PromoCategory } from './types';
import { CATEGORY_ORDER, CATEGORY_LABELS } from './types';

export function currentMonth(now: Date): number {
  return now.getUTCMonth() + 1;
}

export function promosForBirthMonth(promos: BirthdayPromo[], month: number): BirthdayPromo[] {
  return promos.filter((x) => x.evergreen || (x.months?.includes(month) ?? false));
}

export function promosForCalendarMonth(
  promos: BirthdayPromo[], month: number, now: Date
): BirthdayPromo[] {
  return promos.filter((x) => {
    if (!x.months?.includes(month)) return false;
    if (x.validUntilISO && new Date(x.validUntilISO).getTime() < now.getTime()) return false;
    return true;
  });
}

export function groupByCategory(
  promos: BirthdayPromo[]
): Array<{ category: PromoCategory; label: string; items: BirthdayPromo[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: promos.filter((x) => x.category === category)
  })).filter((g) => g.items.length > 0);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run tests/birthday-select.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/birthday/select.ts tests/birthday-select.test.ts
git commit -m "feat: birthday promo selection helpers"
```

---

### Task 4: Birthday data file + loader + integrity test

**Files:**
- Create: `static/data/birthday.json` (seed; replaced/expanded by deep-research output)
- Create: `src/lib/birthday/data.ts`
- Test: `tests/birthday-data.test.ts`

**Interfaces:**
- Consumes: `BirthdayFile`, `BirthdayPromo`, enums from `./types`.
- Produces: `loadBirthday(): Promise<BirthdayFile>`

- [ ] **Step 1: Create seed JSON** (will be overwritten by the researched dataset before final build; this guarantees the module compiles and the integrity test has data)

```json
{
  "generatedAt": "2026-06-17",
  "count": 2,
  "promos": [
    { "id": "starbucks-1", "brand": "Starbucks", "category": "drinks", "channel": "app",
      "condition": "ระดับ Gold", "perk": "รับฟรี! เครื่องดื่ม 1 แก้ว และเบเกอรี่ 1 ชิ้น (ไม่เกิน 150.-)",
      "evergreen": true },
    { "id": "potato-corner-1", "brand": "Potato Corner", "category": "food", "channel": "line",
      "perk": "รับฟรี! เฟรนช์ฟรายส์ไซส์ใหญ่", "evergreen": true }
  ]
}
```

- [ ] **Step 2: Write the failing loader test**

```ts
// tests/birthday-data.test.ts
import { describe, it, expect } from 'vitest';
import { loadBirthday } from '../src/lib/birthday/data';
import { CATEGORY_ORDER, CHANNEL_LABELS } from '../src/lib/birthday/types';

describe('birthday data', () => {
  it('loads file with matching count', async () => {
    const f = await loadBirthday();
    expect(f.promos.length).toBe(f.count);
    expect(typeof f.generatedAt).toBe('string');
  });

  it('every promo has a unique id and valid enums', async () => {
    const { promos } = await loadBirthday();
    const ids = new Set<string>();
    for (const x of promos) {
      expect(ids.has(x.id), `dup id ${x.id}`).toBe(false);
      ids.add(x.id);
      expect(CATEGORY_ORDER).toContain(x.category);
      expect(Object.keys(CHANNEL_LABELS)).toContain(x.channel);
      expect(x.perk.length).toBeGreaterThan(0);
      // must be evergreen or carry valid months
      if (!x.evergreen) {
        expect(Array.isArray(x.months) && x.months.length > 0).toBe(true);
      }
      for (const m of x.months ?? []) expect(m >= 1 && m <= 12).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run, verify fail**

Run: `npx vitest run tests/birthday-data.test.ts`
Expected: FAIL (cannot find module `data`)

- [ ] **Step 4: Implement loader**

```ts
// src/lib/birthday/data.ts
import type { BirthdayFile } from './types';
import file from '../../../static/data/birthday.json';

export async function loadBirthday(): Promise<BirthdayFile> {
  return file as unknown as BirthdayFile;
}
```

- [ ] **Step 5: Run, verify pass**

Run: `npx vitest run tests/birthday-data.test.ts` → PASS

- [ ] **Step 6: Commit**

```bash
git add static/data/birthday.json src/lib/birthday/data.ts tests/birthday-data.test.ts
git commit -m "feat: birthday data seed and loader with integrity test"
```

---

### Task 5: MonthTabs component

**Files:**
- Create: `src/lib/components/MonthTabs.svelte`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `<MonthTabs bind:value={month} />` where `value` is 1-12. Emits via two-way bind.

- [ ] **Step 1: Implement**

```svelte
<!-- src/lib/components/MonthTabs.svelte -->
<script lang="ts">
  export let value: number; // 1-12
  const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
</script>

<div class="tabs" role="tablist" aria-label="เลือกเดือนเกิด">
  {#each MONTHS_TH as label, i}
    <button
      role="tab"
      aria-selected={value === i + 1}
      class:active={value === i + 1}
      on:click={() => (value = i + 1)}
    >{label}</button>
  {/each}
</div>

<style>
  .tabs { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0 10px; }
  button {
    flex: 0 0 auto; border: 1px solid var(--line); background: var(--card);
    color: var(--muted); border-radius: 999px; padding: 8px 16px;
    font-family: inherit; font-weight: 600; cursor: pointer; white-space: nowrap;
  }
  button.active { background: var(--grad); color: #fff; border-color: transparent; }
</style>
```

- [ ] **Step 2: Build check + commit**

Run: `npx vitest run` (all green) then:
```bash
git add src/lib/components/MonthTabs.svelte
git commit -m "feat: MonthTabs selector component"
```

---

### Task 6: BirthdayCard component

**Files:**
- Create: `src/lib/components/BirthdayCard.svelte`

**Interfaces:**
- Consumes: `BirthdayPromo`, `CHANNEL_LABELS` from `$lib/birthday/types`.
- Produces: `<BirthdayCard promo={p} />`

- [ ] **Step 1: Implement**

```svelte
<!-- src/lib/components/BirthdayCard.svelte -->
<script lang="ts">
  import type { BirthdayPromo } from '$lib/birthday/types';
  import { CHANNEL_LABELS } from '$lib/birthday/types';
  export let promo: BirthdayPromo;
  $: channelText = promo.channelLabel ?? CHANNEL_LABELS[promo.channel];
</script>

<article class="card bday">
  <div class="top">
    <h3>{promo.brand}</h3>
    <span class="chip">{channelText}</span>
  </div>
  <p class="perk">{promo.perk}</p>
  {#if promo.condition}<p class="cond">เงื่อนไข: {promo.condition}</p>{/if}
  {#if promo.note}<p class="note">{promo.note}</p>{/if}
  {#if promo.url}<a class="link" href={promo.url} target="_blank" rel="nofollow noopener">ดูรายละเอียด</a>{/if}
</article>

<style>
  .bday { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  h3 { margin: 0; font-size: 1.05rem; }
  .chip { flex: 0 0 auto; font-size: 0.75rem; font-weight: 700; padding: 3px 10px;
    border-radius: 999px; background: color-mix(in srgb, var(--fire2) 14%, transparent); color: var(--fire2); }
  .perk { margin: 2px 0 0; font-weight: 600; }
  .cond, .note { margin: 0; font-size: 0.85rem; color: var(--muted); }
  .link { font-size: 0.85rem; font-weight: 700; color: var(--fire2); text-decoration: none; margin-top: 2px; }
</style>
```

- [ ] **Step 2: Build check + commit**

```bash
git add src/lib/components/BirthdayCard.svelte
git commit -m "feat: BirthdayCard component"
```

---

### Task 7: /birthday route

**Files:**
- Create: `src/routes/birthday/+page.ts`
- Create: `src/routes/birthday/+page.svelte`

**Interfaces:**
- Consumes: `loadBirthday` (`$lib/birthday/data`), selection helpers (`$lib/birthday/select`), `MonthTabs`, `BirthdayCard`, `SITE`, `faqJsonLd`/`breadcrumbJsonLd`/`ldJson` (`$lib/seo`).

- [ ] **Step 1: Implement loader**

```ts
// src/routes/birthday/+page.ts
import { loadBirthday } from '$lib/birthday/data';

export const prerender = true;

export const load = async () => {
  const file = await loadBirthday();
  return { promos: file.promos, generatedAt: file.generatedAt };
};
```

- [ ] **Step 2: Implement page**

```svelte
<!-- src/routes/birthday/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import MonthTabs from '$lib/components/MonthTabs.svelte';
  import BirthdayCard from '$lib/components/BirthdayCard.svelte';
  import {
    currentMonth, promosForBirthMonth, promosForCalendarMonth, groupByCategory
  } from '$lib/birthday/select';
  import { SITE } from '$lib/site';
  import { faqJsonLd, breadcrumbJsonLd, ldJson } from '$lib/seo';

  export let data;
  const base = SITE.base;

  let month = 6; // SSR default; corrected to real current month on mount
  let view: 'birth' | 'calendar' = 'birth';
  onMount(() => { month = currentMonth(new Date()); });

  $: now = new Date(2026, month - 1, 15); // expiry reference within selected month for calendar view
  $: selected = view === 'birth'
    ? promosForBirthMonth(data.promos, month)
    : promosForCalendarMonth(data.promos, month, new Date());
  $: groups = groupByCategory(selected);

  const faqs = [
    { q: 'โปรเดือนเกิดคืออะไร?', a: 'โปรเดือนเกิด คือสิทธิพิเศษที่แบรนด์ต่างๆ มอบให้ในเดือนเกิดของคุณ เช่น เครื่องดื่มฟรี ของหวานฟรี หรือส่วนลด มักรับสิทธิ์ผ่าน LINE หรือแอปของร้าน' },
    { q: 'รับสิทธิ์โปรเดือนเกิดอย่างไร?', a: 'ส่วนใหญ่ต้องเป็นสมาชิกและลงทะเบียนวันเกิดล่วงหน้าผ่าน LINE OA หรือแอปของแบรนด์ บางร้านมีเงื่อนไขระดับสมาชิกหรือยอดซื้อขั้นต่ำ โปรดยืนยันกับร้านค้าก่อนใช้สิทธิ์' }
  ];
</script>

<svelte:head>
  <title>โปรเดือนเกิด 2026 — รวมสิทธิ์วันเกิด เครื่องดื่ม/ของกิน/ความงามฟรี | {SITE.name}</title>
  <meta name="description" content="รวมโปรเดือนเกิดจากแบรนด์ดังทั่วไทย เครื่องดื่มฟรี ของหวานฟรี ส่วนลดวันเกิด รับสิทธิ์ผ่าน LINE/แอป เลือกเดือนเกิดของคุณ อัปเดตล่าสุด 🎂" />
  <link rel="canonical" href={`${base}/birthday`} />
  <meta property="og:title" content={`โปรเดือนเกิด — รวมสิทธิ์วันเกิดทั่วไทย | ${SITE.name}`} />
  <meta property="og:description" content="เลือกเดือนเกิดของคุณ ดูสิทธิ์ฟรีและส่วนลดจากแบรนด์ดัง 🎂" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={`${base}/birthday`} />
  {@html `<script type="application/ld+json">${ldJson(faqJsonLd(faqs))}<\/script>`}
  {@html `<script type="application/ld+json">${ldJson(breadcrumbJsonLd([
    { name: SITE.name, url: base },
    { name: 'โปรเดือนเกิด', url: `${base}/birthday` }
  ]))}<\/script>`}
</svelte:head>

<section class="hero">
  <h1>🎂 <span class="fire-text">โปรเดือนเกิด</span> — รวมสิทธิ์วันเกิดทั่วไทย</h1>
  <p>เลือกเดือนเกิดของคุณ แล้วดูสิทธิ์ฟรีและส่วนลดจากแบรนด์ดัง · อัปเดต {data.generatedAt} · โปรดยืนยันกับร้านค้า</p>
</section>

<div class="controls">
  <div class="view">
    <button class:active={view === 'birth'} on:click={() => (view = 'birth')}>เดือนเกิดฉัน</button>
    <button class:active={view === 'calendar'} on:click={() => (view = 'calendar')}>โปรเดือนนี้</button>
  </div>
  <MonthTabs bind:value={month} />
</div>

{#if groups.length}
  {#each groups as g (g.category)}
    <section class="cat">
      <h2>{g.label}</h2>
      <div class="grid">
        {#each g.items as promo (promo.id)}
          <BirthdayCard {promo} />
        {/each}
      </div>
    </section>
  {/each}
{:else}
  <p class="empty">ยังไม่มีโปรเดือนเกิดสำหรับเดือนนี้ 🎂</p>
{/if}

<section class="faq">
  <h2>คำถามที่พบบ่อย</h2>
  {#each faqs as f}
    <details><summary>{f.q}</summary><p>{f.a}</p></details>
  {/each}
</section>

<style>
  .hero { padding: 40px 0 20px; }
  .hero h1 { font-size: clamp(1.6rem, 4.5vw, 2.6rem); margin: 0 0 8px; line-height: 1.15; }
  .hero p { color: var(--muted); max-width: 640px; }
  .controls { position: sticky; top: 62px; background: color-mix(in srgb, var(--bg) 90%, transparent);
    backdrop-filter: blur(8px); padding-top: 10px; z-index: 5; }
  .view { display: flex; gap: 8px; margin-bottom: 8px; }
  .view button { border: 1px solid var(--line); background: var(--card); color: var(--muted);
    border-radius: 999px; padding: 7px 18px; font-family: inherit; font-weight: 700; cursor: pointer; }
  .view button.active { background: var(--ink); color: var(--bg); border-color: transparent; }
  .cat { margin-top: 26px; }
  .cat h2 { font-size: 1.25rem; margin: 0 0 14px; }
  .empty { padding: 50px 0; text-align: center; color: var(--muted); }
  .faq { margin-top: 48px; }
  .faq h2 { font-size: 1.4rem; }
  details { border: 1px solid var(--line); border-radius: 12px; padding: 14px 18px; margin-bottom: 10px; background: var(--card); }
  summary { font-weight: 700; cursor: pointer; }
  details p { color: var(--muted); margin: 10px 0 0; }
</style>
```

- [ ] **Step 3: Verify build + tests**

Run: `npx vitest run` → all PASS. Run: `npm run build` → succeeds (prerenders `/birthday`).

- [ ] **Step 4: Commit**

```bash
git add src/routes/birthday/+page.ts src/routes/birthday/+page.svelte
git commit -m "feat: /birthday section with month tabs and view toggle"
```

---

### Task 8: Rebrand header, footer, layout JSON-LD, homepage strip

**Files:**
- Modify: `src/lib/components/Header.svelte`
- Modify: `src/lib/components/Footer.svelte`
- Modify: `src/routes/+layout.svelte`
- Modify: `src/lib/seo.ts` (organization/website name → SITE.name)
- Modify: `src/routes/+page.svelte` (add promo strip + adjust brand mentions)

**Interfaces:**
- Consumes: `SITE` from `$lib/site`.

- [ ] **Step 1: Header — brand + section nav**

In `Header.svelte`, import `SITE` and `page` store; set brand text to `{SITE.name}`; add two section links before destinations with active styling:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { SITE } from '$lib/site';
  import { COUNTRY_LABELS } from '$lib/countries';
  import ThemeToggle from './ThemeToggle.svelte';
  const navCountries = ['china', 'japan', 'korea', 'vietnam', 'taiwan', 'hongkong'];
  $: path = $page.url.pathname;
</script>

<header>
  <div class="container bar">
    <a class="brand" href="/">{SITE.name} <span>🔥</span></a>
    <nav>
      <a href="/" class="section" class:active={path === '/'}>🔥 ทัวร์ไฟไหม้</a>
      <a href="/birthday" class="section" class:active={path.startsWith('/birthday')}>🎂 โปรเดือนเกิด</a>
      {#each navCountries as c}
        <a href={`/destination/${c}`}>{COUNTRY_LABELS[c]}</a>
      {/each}
      <a href="/search" class="search-link">ค้นหา</a>
      <ThemeToggle />
    </nav>
  </div>
</header>
```

Add to `<style>`: `.section { color: var(--ink); } .section.active { color: var(--fire2); }`

- [ ] **Step 2: Footer — brand via SITE**

Replace `TourFireMai 🔥` big line with `{SITE.name} 🔥`, update the `©` line to `{SITE.name}`, and reword the first paragraph to describe TionPromo as รวมโปรโมชัน (ทัวร์ไฟไหม้ + โปรเดือนเกิด). Import `SITE`.

- [ ] **Step 3: layout JSON-LD**

`organizationJsonLd`/`webSiteJsonLd` in `seo.ts`: change hardcoded `name: 'TourFireMai'` to accept/use `SITE.name`. Simplest: import `SITE` in `seo.ts` and use `SITE.name`; keep description mentioning ทัวร์ไฟไหม้ + โปรเดือนเกิด.

- [ ] **Step 4: Homepage promo strip**

In `+page.svelte`, under the hero `<section>`, add:

```svelte
<a class="promo-strip" href="/birthday">
  🎂 <strong>โปรเดือนเกิด</strong> — รวมสิทธิ์วันเกิดจากแบรนด์ดังทั่วไทย ดูเลย →
</a>
```
with styling using `.card`/grad accent. Keep all existing tour SEO/meta unchanged (homepage `<title>` may stay TourFireMai-focused for ทัวร์ไฟไหม้ SEO, but brand token references that name the site switch to `{SITE.name}`).

- [ ] **Step 5: Verify**

Run: `npx vitest run` → PASS (site.test still green). Run: `npm run build` → succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/Header.svelte src/lib/components/Footer.svelte src/routes/+layout.svelte src/lib/seo.ts src/routes/+page.svelte
git commit -m "feat: rebrand to TionPromo umbrella with section nav + birthday strip"
```

---

### Task 9: SEO discovery — sitemap + llms.txt

**Files:**
- Modify: `src/routes/sitemap.xml/+server.ts`
- Modify: `src/routes/llms.txt/+server.ts`

- [ ] **Step 1: Add /birthday to sitemap**

In `sitemap.xml/+server.ts`, add `` `${base}/birthday` `` to the `urls` array.

- [ ] **Step 2: Update llms.txt**

Add a section describing TionPromo as the umbrella with two sub-sections, and add `- /birthday` under Pages. Keep tour source list.

- [ ] **Step 3: Verify build + commit**

Run: `npm run build` → succeeds.
```bash
git add src/routes/sitemap.xml/+server.ts src/routes/llms.txt/+server.ts
git commit -m "feat: add /birthday to sitemap and llms.txt"
```

---

### Task 10: Load researched dataset + full verification

**Files:**
- Modify: `static/data/birthday.json` (replace seed with the deep-research ~100+ dataset, normalized to schema)

- [ ] **Step 1: Replace JSON** with the normalized researched dataset (validate against Task 4 integrity test: unique ids, valid enums, months 1-12, evergreen-or-months).

- [ ] **Step 2: Run integrity + all tests**

Run: `npx vitest run` → ALL PASS (birthday-data integrity confirms the new dataset is valid).

- [ ] **Step 3: Full build + check**

Run: `npm run build` and `npm run check` → both succeed.

- [ ] **Step 4: Commit**

```bash
git add static/data/birthday.json
git commit -m "data: seed TionPromo birthday promos (TH 2026, researched)"
```

---

## Self-Review

**Spec coverage:**
- Umbrella brand + section nav → Tasks 1, 8. ✓
- ทัวร์ไฟไหม้ untouched logic → no tour-source tasks; only brand strings/strip in Task 8. ✓
- โปรเดือนเกิด section, every month ordered, current preselected → Tasks 5, 7 (MonthTabs Jan→Dec, onMount currentMonth). ✓
- Both views toggle (birth-month / calendar-month) → Task 3 helpers + Task 7 toggle. ✓
- Datetime auto-select current month → Task 7 onMount. ✓
- Curated JSON seed + edit flow (= editing JSON) → Tasks 4, 10. ✓
- Deep research ~100+ → background workflow → Task 10. ✓
- SEO (sitemap, llms.txt, JSON-LD, meta) → Tasks 7, 8, 9. ✓
- Tests → Tasks 1, 3, 4 + green existing suite. ✓
- Config constant for brand → Task 1. ✓

**Placeholder scan:** All code steps contain full code. JSON in Task 4 is a real 2-entry seed; Task 10 swaps in the researched set. No TBD/TODO.

**Type consistency:** `BirthdayPromo`, `currentMonth`, `promosForBirthMonth`, `promosForCalendarMonth`, `groupByCategory`, `loadBirthday`, `SITE`, `CATEGORY_*`, `CHANNEL_LABELS` used consistently across tasks 2→7. `MonthTabs` two-way `value`, `BirthdayCard` `promo` prop match their consumers.

Note: `now` reactive var in Task 7 step 2 was a leftover for an earlier expiry approach; calendar view passes `new Date()` directly. Remove the unused `$: now` line during implementation to avoid a dead variable.
