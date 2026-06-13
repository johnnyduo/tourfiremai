import { describe, it, expect } from 'vitest';
import { tourJsonLd, itemListJsonLd } from '../src/lib/seo';
import type { Tour } from '../src/lib/types';

const t = {
	id: 'nidnoi-1',
	slug: 'china-x-1',
	source: 'nidnoi',
	sourceUrl: 'u',
	title: 'ทัวร์จีน',
	country: 'china',
	priceFrom: 9999,
	nextDepartISO: '2026-06-20T00:00:00Z',
	periods: [{ departISO: '2026-06-20T00:00:00Z', price: 9999 }],
	fetchedAtISO: '',
	urgencyScore: 1,
	dealScore: 1,
	fireScore: 1
} as Tour;

describe('seo', () => {
	it('tourJsonLd produces a TouristTrip with an Offer in THB', () => {
		const ld = tourJsonLd(t, 'https://tourfiremai.com');
		expect(ld['@type']).toBe('TouristTrip');
		expect(ld.offers.priceCurrency).toBe('THB');
		expect(ld.offers.price).toBe(9999);
	});
	it('itemListJsonLd lists items', () => {
		expect(itemListJsonLd([t], 'https://tourfiremai.com')['@type']).toBe('ItemList');
	});
});
