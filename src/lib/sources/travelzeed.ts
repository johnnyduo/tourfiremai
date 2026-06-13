import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';
import { metaDescription, splitHighlights } from './extract';

const THAI_MONTHS: Record<string, number> = {
	'ม.ค.': 1,
	'ก.พ.': 2,
	'มี.ค.': 3,
	'เม.ย.': 4,
	'พ.ค.': 5,
	'มิ.ย.': 6,
	'ก.ค.': 7,
	'ส.ค.': 8,
	'ก.ย.': 9,
	'ต.ค.': 10,
	'พ.ย.': 11,
	'ธ.ค.': 12
};

function thaiDateToISO(s: string): string | null {
	// "24 มิ.ย. 69" -> Buddhist short year 69 => BE 2569 => 2026
	const m = s.match(/(\d{1,2})\s*([ก-๙.]+)\s*(\d{2})/);
	if (!m) return null;
	const day = +m[1];
	const mon = THAI_MONTHS[m[2]];
	if (!mon) return null;
	const be = 2500 + +m[3];
	const greg = be - 543;
	return new Date(Date.UTC(greg, mon - 1, day)).toISOString();
}

export function parseTravelzeed(html: string, url: string): RawTour | null {
	const sourceId = url.match(/detail\/(\d+)/)?.[1];
	if (!sourceId) return null;
	const title = (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '')
		.replace(/\s*\|.*$/, '')
		.trim();
	const days = Number(title.match(/(\d+)\s*วัน/)?.[1]) || undefined;
	const nights = Number(title.match(/(\d+)\s*คืน/)?.[1]) || undefined;
	const airline = html.match(/alt="([^"]*AIRLINES?[^"]*)"/i)?.[1];
	const image = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];

	const periods: Period[] = [];
	// table rows: <td>24 มิ.ย. 69 - 28 มิ.ย. 69</td><td>11,900</td>
	const rowRe =
		/<td[^>]*>\s*(\d{1,2}\s*[ก-๙.]+\s*\d{2})\s*-\s*(\d{1,2}\s*[ก-๙.]+\s*\d{2})\s*<\/td>\s*<td[^>]*>\s*([0-9][0-9,]{3,})\s*<\/td>/g;
	let m: RegExpExecArray | null;
	while ((m = rowRe.exec(html))) {
		const departISO = thaiDateToISO(m[1]);
		const returnISO = thaiDateToISO(m[2]);
		const price = Number(m[3].replace(/,/g, ''));
		if (departISO && price >= 1000)
			periods.push({ departISO, returnISO: returnISO ?? undefined, price });
	}

	if (!periods.length) {
		const p = Number((html.match(/ราคา\s*([0-9,]{4,})\s*บาท/)?.[1] ?? '').replace(/,/g, ''));
		if (p >= 1000) periods.push({ departISO: new Date().toISOString(), price: p });
	}
	if (!periods.length) return null;

	const description = metaDescription(html);
	return {
		source: 'travelzeed',
		sourceId,
		sourceUrl: url,
		title,
		description,
		highlights: splitHighlights(description),
		countryRaw: title,
		image: image || undefined,
		airline,
		days,
		nights,
		periods
	};
}

export const travelzeed: Adapter = {
	id: 'travelzeed',
	label: 'ทราเวลซี้ด',
	enabled: true,
	async discover() {
		const sm = await getText('https://www.travelzeed.com/sitemap-tour-products.xml');
		return sm.match(/https:\/\/www\.travelzeed\.com\/tour\/detail\/\d+/g) ?? [];
	},
	async fetchOne(url) {
		try {
			return parseTravelzeed(await getText(url), url);
		} catch {
			return null;
		}
	}
};
