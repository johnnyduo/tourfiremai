import { describe, it, expect } from 'vitest';
import {
	currentMonth,
	promosForBirthMonth,
	promosForCalendarMonth,
	monthSpecific,
	evergreenPromos,
	groupByCategory
} from '../src/lib/birthday/select';
import type { BirthdayPromo } from '../src/lib/birthday/types';

const p = (over: Partial<BirthdayPromo>): BirthdayPromo => ({
	id: over.id ?? 'x',
	brand: 'B',
	category: over.category ?? 'drinks',
	channel: 'line',
	perk: 'free',
	evergreen: over.evergreen ?? false,
	...over
});

const promos: BirthdayPromo[] = [
	p({ id: 'ever', evergreen: true, category: 'drinks' }),
	p({ id: 'jun-only', evergreen: false, months: [6], category: 'food' }),
	p({ id: 'jan-only', evergreen: false, months: [1], category: 'food' }),
	p({ id: 'ever-jun', evergreen: true, months: [6], category: 'cosmetic' }),
	p({
		id: 'expired-jun',
		evergreen: false,
		months: [6],
		validUntilISO: '2026-06-10',
		category: 'food'
	})
];

describe('currentMonth', () => {
	it('returns 1-based local month', () => {
		// local-time constructor → deterministic regardless of runner TZ
		expect(currentMonth(new Date(2026, 5, 17))).toBe(6);
		expect(currentMonth(new Date(2026, 0, 2))).toBe(1);
	});
});

describe('promosForBirthMonth', () => {
	it('includes all evergreen plus month-specific for that month', () => {
		const ids = promosForBirthMonth(promos, 6).map((x) => x.id);
		expect(ids).toContain('ever');
		expect(ids).toContain('ever-jun');
		expect(ids).toContain('jun-only');
		expect(ids).toContain('expired-jun'); // birth-month view ignores expiry
		expect(ids).not.toContain('jan-only');
	});
	it('evergreen still shows in a month with no specific promos', () => {
		const ids = promosForBirthMonth(promos, 3).map((x) => x.id);
		expect(ids).toEqual(['ever', 'ever-jun']);
	});
});

describe('promosForCalendarMonth', () => {
	const now = new Date('2026-06-17T00:00:00Z');
	it('only month-dated promos, excludes pure evergreen, excludes expired', () => {
		const ids = promosForCalendarMonth(promos, 6, now).map((x) => x.id);
		expect(ids).toContain('jun-only');
		expect(ids).toContain('ever-jun'); // evergreen but carries months:[6]
		expect(ids).not.toContain('ever'); // pure evergreen, no months
		expect(ids).not.toContain('expired-jun'); // past validUntil
		expect(ids).not.toContain('jan-only');
	});
});

describe('monthSpecific', () => {
	it('returns only non-evergreen promos pinned to the month', () => {
		const ids = monthSpecific(promos, 6).map((x) => x.id);
		expect(ids).toContain('jun-only');
		expect(ids).toContain('expired-jun');
		expect(ids).not.toContain('ever'); // pure evergreen excluded
		expect(ids).not.toContain('ever-jun'); // evergreen even if it carries months
		expect(ids).not.toContain('jan-only');
	});
	it('is empty for a month with no pinned campaigns', () => {
		expect(monthSpecific(promos, 3)).toEqual([]);
	});
});

describe('evergreenPromos', () => {
	it('returns only evergreen promos, order preserved', () => {
		const ids = evergreenPromos(promos).map((x) => x.id);
		expect(ids).toEqual(['ever', 'ever-jun']);
	});
});

describe('groupByCategory', () => {
	it('returns fixed order and drops empty categories', () => {
		const groups = groupByCategory(promosForBirthMonth(promos, 6));
		expect(groups.map((g) => g.category)).toEqual(['drinks', 'food', 'cosmetic']);
		expect(groups[0].label).toBe('เครื่องดื่ม / ขนม');
	});
});
