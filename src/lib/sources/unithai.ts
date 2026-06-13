import type { Adapter } from './types';
import type { RawTour, Period } from '../types';
import { getText } from './http';
import { metaDescription, splitHighlights } from './extract';

/**
 * Unithai (ยูนิไทยทราเวล). Tour data lives on
 *   /th/trip_detail2.php?route_id={code}
 * The starting price is rendered as `เริ่ม ฿ 12,900`. Period-level prices are
 * filled by JS (not in static HTML), so we use the page's own starting price.
 * `book` is kept as an optional secondary source if a price is absent in detail.
 */
export function parseUnithai(detail: string, book: string, code: string): RawTour | null {
	const title = (detail.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '')
		.replace(/\s*\|.*$/, '')
		.trim();
	if (!title) return null;

	const days = Number(title.match(/(\d+)\s*วัน/)?.[1]) || undefined;
	const nights = Number(title.match(/(\d+)\s*คืน/)?.[1]) || undefined;
	const image =
		detail.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] ??
		detail.match(/unithaitravel\.com\/__files\/t\/[a-z]+\/[A-Za-z0-9-]+\.jpg/i)?.[0];

	// The first "เริ่ม ฿ N" on the page is this tour's lead price.
	const prices: number[] = [];
	// price may be wrapped in tags: `เริ่ม <font ...>฿ 12,900`
	for (const m of detail.matchAll(/เริ่ม[\s\S]{0,60}?฿?\s*([0-9]{1,3}(?:,[0-9]{3})+)/g)) {
		const n = Number(m[1].replace(/,/g, ''));
		if (n >= 3000 && n <= 500000) prices.push(n);
	}
	if (!prices.length) {
		for (const m of book.matchAll(/฿?\s*([0-9]{2,3},[0-9]{3})\s*บาท/g)) {
			const n = Number(m[1].replace(/,/g, ''));
			if (n >= 3000 && n <= 500000) prices.push(n);
		}
	}
	if (!prices.length) return null;

	// The first "เริ่ม ฿ N" on the page is this tour's own lead price.
	const periods: Period[] = [{ departISO: new Date().toISOString(), price: prices[0] }];

	const description = metaDescription(detail);
	return {
		source: 'unithai',
		sourceId: code,
		sourceUrl: `https://www.unithaitravel.com/th/trip_detail2.php?route_id=${code}`,
		title,
		description,
		highlights: splitHighlights(description),
		countryRaw: title,
		image: image ? (image.startsWith('http') ? image : `https://${image}`) : undefined,
		days,
		nights,
		periods
	};
}

export const unithai: Adapter = {
	id: 'unithai',
	label: 'ยูนิไทยทราเวล',
	enabled: true,
	async discover() {
		// Crawl the homepage + category listing for route_id codes.
		const codes = new Set<string>();
		const pages = [
			'https://www.unithaitravel.com/th/',
			'https://www.unithaitravel.com/'
		];
		for (const p of pages) {
			try {
				const html = await getText(p);
				for (const m of html.matchAll(/route_id=(\d+)/g)) codes.add(m[1]);
			} catch {
				/* skip */
			}
		}
		return [...codes];
	},
	async fetchOne(code) {
		try {
			const detail = await getText(
				`https://www.unithaitravel.com/th/trip_detail2.php?route_id=${code}`
			);
			let book = '';
			try {
				book = await getText(`https://www.unithaitravel.com/th/trip_book.php?route_id=${code}`);
			} catch {
				/* book is optional */
			}
			return parseUnithai(detail, book, code);
		} catch {
			return null;
		}
	}
};
