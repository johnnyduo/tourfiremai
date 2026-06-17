import { describe, it, expect } from 'vitest';
import { loadBirthday } from '../src/lib/birthday/data';
import { CATEGORY_ORDER, CHANNEL_LABELS } from '../src/lib/birthday/types';

describe('birthday data', () => {
	it('loads file with matching count', async () => {
		const f = await loadBirthday();
		expect(f.promos.length).toBe(f.count);
		expect(typeof f.generatedAt).toBe('string');
	});

	it('every promo has a unique id and valid enums', async () => {
		const { promos } = await loadBirthday();
		const ids = new Set<string>();
		for (const x of promos) {
			expect(ids.has(x.id), `dup id ${x.id}`).toBe(false);
			ids.add(x.id);
			expect(CATEGORY_ORDER).toContain(x.category);
			expect(Object.keys(CHANNEL_LABELS)).toContain(x.channel);
			expect(x.perk.length).toBeGreaterThan(0);
			// must be evergreen or carry valid months
			if (!x.evergreen) {
				expect(Array.isArray(x.months) && x.months.length > 0).toBe(true);
			}
			for (const m of x.months ?? []) expect(m >= 1 && m <= 12).toBe(true);
		}
	});
});
