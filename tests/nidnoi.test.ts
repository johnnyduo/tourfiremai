import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseNidnoi } from '../src/lib/sources/nidnoi';

const html = readFileSync('tests/fixtures/nidnoi-tour.html', 'utf8');

describe('parseNidnoi', () => {
	const t = parseNidnoi(html, 'https://www.nidnoitravel.com/tour/nidn261912/');
	it('extracts source + id', () => {
		expect(t?.source).toBe('nidnoi');
		expect(t?.sourceId).toBe('261912');
	});
	it('extracts a title', () => expect((t?.title ?? '').length).toBeGreaterThan(5));
	it('extracts at least one period with ISO date + price', () => {
		expect(t?.periods.length).toBeGreaterThan(0);
		expect(t?.periods[0].departISO).toMatch(/^\d{4}-\d{2}-\d{2}/);
		expect(t?.periods[0].price).toBeGreaterThan(0);
	});
	it('flags soldout when seats <= 0', () => {
		const sold = t?.periods.find((p) => p.soldOut);
		expect(sold).toBeTruthy();
	});
});
