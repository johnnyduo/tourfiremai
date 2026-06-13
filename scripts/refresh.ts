import { writeFileSync, mkdirSync } from 'node:fs';
import type { Adapter } from '../src/lib/sources/types';
import type { Tour, RawTour } from '../src/lib/types';
import { toTour } from '../src/lib/normalize';
import { normalizeCountry } from '../src/lib/countries';
import { dedupe } from '../src/lib/dedupe';
import { mapLimit } from '../src/lib/sources/http';
import { enabledAdapters } from '../src/lib/sources';

function median(arr: number[]): number {
	const s = [...arr].sort((a, b) => a - b);
	return s.length ? s[Math.floor(s.length / 2)] : 0;
}

export async function buildDeals(
	adapters: Adapter[],
	now = new Date(),
	perSourceLimit = 200
): Promise<Tour[]> {
	const raws: RawTour[] = [];
	for (const a of adapters) {
		try {
			const refs = (await a.discover()).slice(0, perSourceLimit);
			const results = await mapLimit(refs, 5, (r) => a.fetchOne(r));
			for (const r of results) if (r && r.periods.length) raws.push(r);
			console.log(`[${a.id}] ${refs.length} refs -> ${results.filter(Boolean).length} tours`);
		} catch (e) {
			console.error(`[${a.id}] failed:`, (e as Error).message);
		}
	}

	// per-country median price for the deal score
	const byCountry = new Map<string, number[]>();
	for (const r of raws) {
		const c = normalizeCountry(r.countryRaw || r.title);
		const priceFrom = Math.min(...r.periods.map((p) => p.price));
		const list = byCountry.get(c) ?? [];
		list.push(priceFrom);
		byCountry.set(c, list);
	}
	const medians = new Map([...byCountry].map(([k, v]) => [k, median(v)]));

	const tours = raws.map((r) =>
		toTour(r, now, medians.get(normalizeCountry(r.countryRaw || r.title)))
	);
	return dedupe(tours);
}

export interface DealsPayload {
	generatedAt: string;
	count: number;
	deals: Tour[];
}

export async function refresh(outPath = 'static/data/deals.json'): Promise<DealsPayload> {
	const now = new Date();
	const deals = await buildDeals(enabledAdapters(), now);
	mkdirSync('static/data', { recursive: true });
	const payload: DealsPayload = {
		generatedAt: now.toISOString(),
		count: deals.length,
		deals
	};
	// Don't wipe a good snapshot with an empty result.
	if (payload.count > 0) {
		writeFileSync(outPath, JSON.stringify(payload));
	} else {
		console.warn('refresh produced 0 deals — keeping existing snapshot');
	}
	return payload;
}
