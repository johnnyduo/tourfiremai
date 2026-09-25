import { writeFileSync, mkdirSync } from 'node:fs';
import type { Adapter } from '../src/lib/sources/types';
import type { Tour, RawTour } from '../src/lib/types';
import { toTour } from '../src/lib/normalize';
import { normalizeCountry } from '../src/lib/countries';
import { dedupe } from '../src/lib/dedupe';
import { mapLimit } from '../src/lib/sources/http';
import { enabledAdapters } from '../src/lib/sources';
import { warmUrls } from '../src/lib/images';

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
		await warmImageCache(deals.map((d) => d.image));
	} else {
		console.warn('refresh produced 0 deals — keeping existing snapshot');
	}
	return payload;
}

/**
 * Pre-warm wsrv.nl's CDN cache so the first real visitor gets a fast (~0.1s)
 * cached WebP instead of a slow (~3s) cold conversion. Best-effort, capped,
 * and bounded overall so a slow/cold CDN can't hang the whole refresh job
 * (it previously ran unbounded and silently blocked the run for 8+ minutes).
 */
async function warmImageCache(images: Array<string | undefined>, budgetMs = 4 * 60 * 1000) {
	const urls = warmUrls(images).slice(0, 1400);
	let ok = 0;
	let done = 0;
	const deadline = Date.now() + budgetMs;
	const work = mapLimit(urls, 40, async (u) => {
		if (Date.now() > deadline) return;
		try {
			await fetch(u, { method: 'GET', signal: AbortSignal.timeout(10000) });
			ok++;
		} catch {
			/* best effort */
		} finally {
			done++;
			if (done % 200 === 0) console.log(`warming… ${done}/${urls.length}`);
		}
	});
	await Promise.race([work, new Promise((r) => setTimeout(r, budgetMs))]);
	console.log(`warmed ${ok}/${urls.length} image variants`);
}
