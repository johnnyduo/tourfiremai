import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';

export function discoverUpFromHtml(html: string): string[] {
	const set = new Set<string>();
	for (const m of html.matchAll(
		/href="(https:\/\/www\.tourfiremai\.com\/(?:cview|domestic|country)\/[^"]+)"/g
	))
		set.add(m[1]);
	return [...set];
}

export function parseUpOperation(html: string, url: string): RawTour | null {
	const sourceId = decodeURIComponent(url.split('/').filter(Boolean).pop() ?? url).slice(0, 40);
	const title = (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '')
		.replace(/\s*::.*$/, '')
		.replace(/\s*\|.*$/, '')
		.trim();
	if (!title) return null;

	const days = Number(title.match(/(\d+)\s*วัน/)?.[1]) || undefined;
	const nights = Number(title.match(/(\d+)\s*คืน/)?.[1]) || undefined;
	const image = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];

	const prices = [...html.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)\s*บาท/g)]
		.map((m) => Number(m[1].replace(/,/g, '')))
		.filter((n) => n >= 3000 && n <= 500000);
	if (!prices.length) return null;

	const periods: Period[] = [{ departISO: new Date().toISOString(), price: Math.min(...prices) }];

	return {
		source: 'uphol',
		sourceId,
		sourceUrl: url,
		title,
		countryRaw: title,
		image: image || undefined,
		days,
		nights,
		periods
	};
}

export const upoperation: Adapter = {
	id: 'uphol',
	label: 'อัพ-โอเปอเรชั่น',
	enabled: true,
	async discover() {
		const home = await getText('https://www.tourfiremai.com/');
		// keep only individual-tour detail pages (cview), not category listings.
		return discoverUpFromHtml(home).filter((u) => /\/cview\//.test(u));
	},
	async fetchOne(url) {
		try {
			return parseUpOperation(await getText(url), url);
		} catch {
			return null;
		}
	}
};
