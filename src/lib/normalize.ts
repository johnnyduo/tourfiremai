import type { RawTour, Tour } from './types';
import { normalizeCountry } from './countries';
import { urgencyScore, dealScore, fireScore } from './score';

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9ก-๙]+/gi, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);

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
	const discountPct = next?.priceBefore
		? Math.round(((next.priceBefore - next.price) / next.priceBefore) * 100)
		: undefined;
	const u = urgencyScore({ nextDepartISO: next?.departISO, minSeats }, now);
	const d = dealScore({ priceFrom, countryMedian, discountPct });
	return {
		...raw,
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
