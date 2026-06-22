import { describe, it, expect } from 'vitest';
import { loadCardPromos } from '../src/lib/card/data';
import { CATEGORY_ORDER } from '../src/lib/card/types';

describe('card data', () => {
	it('loads file with matching count', async () => {
		const f = await loadCardPromos();
		expect(f.promos.length).toBe(f.count);
		expect(typeof f.generatedAt).toBe('string');
	});

	it('every promo has a unique id, valid category, and a perk', async () => {
		const { promos } = await loadCardPromos();
		const ids = new Set<string>();
		for (const x of promos) {
			expect(ids.has(x.id), `dup id ${x.id}`).toBe(false);
			ids.add(x.id);
			expect(CATEGORY_ORDER).toContain(x.category);
			expect(x.bank.length).toBeGreaterThan(0);
			expect(x.perk.length).toBeGreaterThan(0);
			// dated promos must carry a parseable validUntil
			if (x.validUntilISO) {
				expect(Number.isNaN(new Date(x.validUntilISO).getTime())).toBe(false);
			}
		}
	});
});
