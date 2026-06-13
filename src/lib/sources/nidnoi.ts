import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';
import { metaDescription, normalizeAirline } from './extract';

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
		// number_seats = groupsize - number_book; only meaningful when groupsize > 0.
		// When groupsize is 0/unset the operator hasn't published a real seat count,
		// so we leave seats undefined rather than show a misleading "0".
		const groupsize = Number(window.match(/"groupsize":"?(\d+)"?/)?.[1] ?? 0);
		const seatsRaw = Number(window.match(/"number_seats":(-?\d+)/)?.[1]);
		const hasRealSeats = groupsize > 0 && Number.isFinite(seatsRaw);
		const seats = hasRealSeats ? Math.max(0, seatsRaw) : undefined;
		const flagged = /"period_soldout":\s*(?:true|1|"1"|"true")/.test(window);
		const price = Number(m[3]);
		if (!price) continue;
		periods.push({
			departISO: new Date(m[1]).toISOString(),
			returnISO: new Date(m[2]).toISOString(),
			price,
			priceBefore: before && before > price ? before : undefined,
			seats,
			soldOut: flagged || (hasRealSeats && seatsRaw <= 0) || undefined
		});
	}
	if (!periods.length) return null;

	return {
		source: 'nidnoi',
		sourceId,
		sourceUrl: url,
		title,
		description: metaDescription(html),
		countryRaw: title,
		image: image ? `https://${image}` : undefined,
		airline: normalizeAirline(airlinePic ? airlinePic.split('/').pop() : undefined),
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
		// Live tour links (/tour/nidn{id}/) are on listing pages, NOT the sitemap
		// (whose package-tour entries are stale from 2019).
		const urls = new Set<string>();
		const pages = ['https://www.nidnoitravel.com/', 'https://www.nidnoitravel.com/tour/'];
		for (const p of pages) {
			try {
				const html = await getText(p);
				for (const u of html.match(/\/tour\/nidn\d+/gi) ?? [])
					urls.add(`https://www.nidnoitravel.com${u}/`.replace(/\/+$/, '/'));
			} catch {
				/* skip */
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
