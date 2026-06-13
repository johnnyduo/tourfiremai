import { describe, it, expect } from 'vitest';
import { buildDeals } from '../scripts/refresh';
import type { Adapter } from '../src/lib/sources/types';

const fake: Adapter = {
	id: 'nidnoi',
	label: 'x',
	enabled: true,
	async discover() {
		return ['u1'];
	},
	async fetchOne() {
		return {
			source: 'nidnoi',
			sourceId: '1',
			sourceUrl: 'u1',
			title: 'ทัวร์จีน 5 วัน',
			countryRaw: 'จีน',
			periods: [{ departISO: '2026-06-20T00:00:00Z', price: 9999 }]
		};
	}
};

describe('buildDeals', () => {
	it('discovers, fetches, normalizes, sorts by fireScore', async () => {
		const deals = await buildDeals([fake], new Date('2026-06-13T00:00:00Z'), 10);
		expect(deals.length).toBe(1);
		expect(deals[0].country).toBe('china');
		expect(deals[0].fireScore).toBeGreaterThan(0);
	});

	it('survives an adapter that throws', async () => {
		const bad: Adapter = {
			...fake,
			async discover() {
				throw new Error('boom');
			}
		};
		const deals = await buildDeals([bad, fake], new Date('2026-06-13T00:00:00Z'), 10);
		expect(deals.length).toBe(1);
	});
});
