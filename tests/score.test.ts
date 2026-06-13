import { describe, it, expect } from 'vitest';
import { urgencyScore, dealScore, fireScore } from '../src/lib/score';

const NOW = new Date('2026-06-13T00:00:00Z');

describe('urgencyScore', () => {
	it('is high when departure is very soon', () => {
		expect(urgencyScore({ nextDepartISO: '2026-06-15T00:00:00Z' }, NOW)).toBeGreaterThan(80);
	});
	it('is low when departure is far away', () => {
		expect(urgencyScore({ nextDepartISO: '2026-12-01T00:00:00Z' }, NOW)).toBeLessThan(30);
	});
	it('adds a bonus when seats are low', () => {
		const far = { nextDepartISO: '2026-08-01T00:00:00Z' };
		expect(urgencyScore({ ...far, minSeats: 2 }, NOW)).toBeGreaterThan(urgencyScore(far, NOW));
	});
	it('returns 0 when no departure date', () => {
		expect(urgencyScore({}, NOW)).toBe(0);
	});
});

describe('dealScore', () => {
	it('is higher for cheaper price within its country band', () => {
		const cheap = dealScore({ priceFrom: 8000, countryMedian: 20000 });
		const pricey = dealScore({ priceFrom: 30000, countryMedian: 20000 });
		expect(cheap).toBeGreaterThan(pricey);
	});
	it('adds discount bonus', () => {
		// price at median -> base is 50, leaving headroom for the discount bonus
		expect(dealScore({ priceFrom: 20000, countryMedian: 20000, discountPct: 40 })).toBeGreaterThan(
			dealScore({ priceFrom: 20000, countryMedian: 20000 })
		);
	});
});

describe('fireScore', () => {
	it('blends urgency and deal weighted 0.55/0.45', () => {
		expect(fireScore(100, 0)).toBeCloseTo(55);
		expect(fireScore(0, 100)).toBeCloseTo(45);
	});
});
