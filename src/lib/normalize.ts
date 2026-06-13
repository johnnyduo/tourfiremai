import type { RawTour, Tour } from './types';
import { normalizeCountry } from './countries';
import { urgencyScore, dealScore, fireScore } from './score';
import { synthDescription } from './sources/extract';
import { SOURCE_LABELS } from './sources-meta';

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9ก-๙]+/gi, '-')
		.replace(/-+/g, '-')
		.slice(0, 60)
		.replace(/^-+|-+$/g, '');

export function toTour(raw: RawTour, now = new Date(), countryMedian?: number): Tour {
	const country = normalizeCountry(raw.countryRaw || raw.title);
	const available = raw.periods
		.filter((p) => !p.soldOut && new Date(p.departISO).getTime() >= now.getTime())
		.sort((a, b) => +new Date(a.departISO) - +new Date(b.departISO));
	const priceFrom = Math.min(...raw.periods.map((p) => p.price));
	const next = available[0];
	const minSeats = available.reduce<number | undefined>(
		(m, p) => (p.seats != null ? Math.min(m ?? Infinity, p.seats) : m),
		undefined
	);
	// Prefer the soonest available period's discount; otherwise the best discount
	// across all periods (so a discounted-but-not-soonest period still shows).
	const discountOf = (p: { price: number; priceBefore?: number }) =>
		p.priceBefore && p.priceBefore > p.price
			? Math.round(((p.priceBefore - p.price) / p.priceBefore) * 100)
			: 0;
	const discountPct =
		(next && discountOf(next)) ||
		Math.max(0, ...raw.periods.map(discountOf)) ||
		undefined;
	const u = urgencyScore({ nextDepartISO: next?.departISO, minSeats }, now);
	const d = dealScore({ priceFrom, countryMedian, discountPct });
	const description =
		raw.description && raw.description.length >= 30
			? raw.description
			: synthDescription({
					title: raw.title,
					country,
					days: raw.days,
					nights: raw.nights,
					airline: raw.airline,
					priceFrom,
					operator: SOURCE_LABELS[raw.source]
				});
	return {
		...raw,
		description,
		id: `${raw.source}-${raw.sourceId}`,
		slug: `${country}-${slugify(raw.title)}-${raw.sourceId}`,
		country,
		priceFrom,
		discountPct,
		nextDepartISO: next?.departISO,
		fetchedAtISO: now.toISOString(),
		urgencyScore: u,
		dealScore: d,
		fireScore: fireScore(u, d)
	};
}
