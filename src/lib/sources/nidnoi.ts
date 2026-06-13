import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';

export function parseNidnoi(html: string, url: string): RawTour | null {
	const idMatch = url.match(/nidn(\d+)/i);
	if (!idMatch) return null;
	const sourceId = idMatch[1];
	const text = html.replace(/&quot;/g, '"');

	// Title from og:title, strip the trailing " - NIDN..." code.
	const title = (
		html.match(/og:title"\s+content="([^"]+)"/i)?.[1] ??
		html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
		''
	)
		.replace(/\s*-\s*NIDN\d+.*$/i, '')
		.replace(/\s*\|.*$/, '')
		.trim();

	const days = Number(text.match(/"stay_day":\s*"?(\d+)/)?.[1]) || undefined;
	const nights = Number(text.match(/"stay_night":\s*"?(\d+)/)?.[1]) || undefined;
	const airlinePic = text.match(/"url_airline_pic"\s*:\s*"([^"]*)"/)?.[1];
	const image = html.match(
		/nidnoitravel\.com\/wow\/upload\/[^"'\\ ]+ImageProduct[^"'\\ ]+?\.(?:png|jpg|jpeg|webp)/i
	)?.[0];

	const periods: Period[] = [];
	const re =
		/"period_start_value":"([^"]+)"[^}]*?"period_end_value":"([^"]+)"[^}]*?"price_adults_double":(\d+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) {
		// window spans this period block, bounded by the next period's start to avoid bleed.
		const rest = text.slice(m.index + 10);
		const nextBoundary = rest.indexOf('"period_id"');
		const window = text.slice(m.index, m.index + 10 + (nextBoundary > 0 ? nextBoundary : 900));
		const before = Number(window.match(/"price_before_discount":(\d+)/)?.[1]);
		const seatsRaw = window.match(/"number_seats":(-?\d+)/)?.[1];
		const seats = seatsRaw != null ? Number(seatsRaw) : undefined;
		const flagged = /"period_soldout":\s*(?:true|1|"1"|"true")/.test(window);
		const price = Number(m[3]);
		if (!price) continue;
		periods.push({
			departISO: new Date(m[1]).toISOString(),
			returnISO: new Date(m[2]).toISOString(),
			price,
			priceBefore: before && before > price ? before : undefined,
			seats: seats != null && seats > 0 ? seats : seats === 0 || (seats ?? 1) < 0 ? 0 : undefined,
			soldOut: flagged || (seats != null && seats <= 0) || undefined
		});
	}
	if (!periods.length) return null;

	return {
		source: 'nidnoi',
		sourceId,
		sourceUrl: url,
		title,
		countryRaw: title,
		image: image ? `https://${image}` : undefined,
		airline: airlinePic ? airlinePic.split('/').pop()?.replace(/\.\w+$/, '') : undefined,
		days,
		nights,
		periods
	};
}

export const nidnoi: Adapter = {
	id: 'nidnoi',
	label: 'นิดหน่อยทราเวล',
	enabled: true,
	async discover() {
		const idx = await getText('https://www.nidnoitravel.com/sitemap_index.xml');
		const subs = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
		const urls = new Set<string>();
		for (const s of subs.filter((u) => /tour|product|post|page|sitemap/i.test(u))) {
			try {
				const sm = await getText(s);
				for (const u of sm.match(/https:\/\/www\.nidnoitravel\.com\/tour\/nidn\d+\/?/gi) ?? [])
					urls.add(u);
			} catch {
				/* skip bad sub-sitemap */
			}
		}
		return [...urls];
	},
	async fetchOne(url) {
		try {
			return parseNidnoi(await getText(url), url);
		} catch {
			return null;
		}
	}
};
