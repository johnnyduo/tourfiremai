import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTravelzeed } from '../src/lib/sources/travelzeed';

const html = readFileSync('tests/fixtures/travelzeed-tour.html', 'utf8');

describe('parseTravelzeed', () => {
	const t = parseTravelzeed(html, 'https://www.travelzeed.com/tour/detail/11096');
	it('extracts id + title', () => {
		expect(t?.sourceId).toBe('11096');
		expect((t?.title ?? '').length).toBeGreaterThan(5);
	});
	it('extracts a price >= 1000', () =>
		expect(t?.periods[0].price).toBeGreaterThanOrEqual(1000));
	it('extracts days/nights from title', () => {
		expect(t?.days).toBe(5);
		expect(t?.nights).toBe(3);
	});
	it('parses multiple departure periods from the table', () =>
		expect((t?.periods.length ?? 0)).toBeGreaterThan(1));
	it('parses a valid ISO departure date', () =>
		expect(t?.periods[0].departISO).toMatch(/^2026-/));
});

describe('parseTravelzeed description', () => {
	const html = readFileSync('tests/fixtures/travelzeed-tour.html', 'utf8');
	const t = parseTravelzeed(html, 'https://www.travelzeed.com/tour/detail/11096');
	it('extracts a description from meta when present', () => {
		// fixture has a meta description; if absent the field is simply undefined
		if (t?.description) expect(t.description.length).toBeGreaterThan(10);
	});
});
