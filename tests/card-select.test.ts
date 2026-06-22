import { describe, it, expect } from 'vitest';
import { isExpired, activePromos, daysLeft, groupByCategory } from '../src/lib/card/select';
import type { CardPromo } from '../src/lib/card/types';

const p = (over: Partial<CardPromo>): CardPromo => ({
	id: over.id ?? 'x',
	bank: 'KTC',
	category: over.category ?? 'dining',
	perk: 'cashback',
	evergreen: over.evergreen ?? false,
	...over
});

const now = new Date('2026-06-22T00:00:00Z');

describe('isExpired', () => {
	it('evergreen never expires', () => {
		expect(isExpired(p({ evergreen: true }), now)).toBe(false);
	});
	it('dated promo past validUntil is expired', () => {
		expect(isExpired(p({ validUntilISO: '2026-06-01' }), now)).toBe(true);
	});
	it('dated promo in the future is not expired', () => {
		expect(isExpired(p({ validUntilISO: '2026-12-31' }), now)).toBe(false);
	});
});

describe('activePromos', () => {
	it('drops expired, keeps evergreen + future-dated', () => {
		const list = [
			p({ id: 'gone', validUntilISO: '2026-01-01' }),
			p({ id: 'ever', evergreen: true }),
			p({ id: 'future', validUntilISO: '2026-12-31' })
		];
		expect(activePromos(list, now).map((x) => x.id)).toEqual(['ever', 'future']);
	});
});

describe('daysLeft', () => {
	it('null for evergreen', () => {
		expect(daysLeft(p({ evergreen: true }), now)).toBeNull();
	});
	it('null for already-expired', () => {
		expect(daysLeft(p({ validUntilISO: '2026-06-01' }), now)).toBeNull();
	});
	it('counts days to expiry', () => {
		expect(daysLeft(p({ validUntilISO: '2026-06-25' }), now)).toBe(3);
	});
});

describe('groupByCategory', () => {
	it('returns fixed order with icon + label, drops empty', () => {
		const groups = groupByCategory([
			p({ category: 'fuel' }),
			p({ category: 'dining' }),
			p({ category: 'dining' })
		]);
		expect(groups.map((g) => g.category)).toEqual(['dining', 'fuel']);
		expect(groups[0].label).toBe('ร้านอาหาร');
		expect(groups[0].icon).toBe('🍽️');
		expect(groups[0].items.length).toBe(2);
	});
});
