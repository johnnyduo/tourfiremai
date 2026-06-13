import { describe, it, expect } from 'vitest';
import { toTour } from '../src/lib/normalize';
import type { RawTour } from '../src/lib/types';

const raw: RawTour = {
	source: 'nidnoi',
	sourceId: '261912',
	sourceUrl: 'https://www.nidnoitravel.com/tour/nidn261912/',
	title: 'ทัวร์จีน ฉงชิ่ง 5 วัน 3 คืน',
	airline: 'CZ',
	days: 5,
	nights: 3,
	periods: [
		{ departISO: '2026-06-20T00:00:00Z', price: 9888, priceBefore: 12888, seats: 4 },
		{ departISO: '2026-06-13T00:00:00Z', price: 6888, seats: 0, soldOut: true }
	]
};

describe('toTour', () => {
	const t = toTour(raw, new Date('2026-06-13T00:00:00Z'));
	it('builds id and slug', () => {
		expect(t.id).toBe('nidnoi-261912');
		expect(t.slug).toContain('china');
		expect(t.slug).toContain('261912');
	});
	it('normalizes country from title', () => expect(t.country).toBe('china'));
	it('priceFrom is the min period price', () => expect(t.priceFrom).toBe(6888));
	it('nextDepartISO skips soldout/past, picks soonest available', () =>
		expect(t.nextDepartISO).toBe('2026-06-20T00:00:00Z'));
	it('computes discountPct from the cheapest available period', () =>
		expect(t.discountPct).toBe(23)); // (12888-9888)/12888 ~ 23%
	it('produces a fireScore between 0 and 100', () => {
		expect(t.fireScore).toBeGreaterThanOrEqual(0);
		expect(t.fireScore).toBeLessThanOrEqual(100);
	});
});
