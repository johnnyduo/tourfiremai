import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseNidnoi } from '../src/lib/sources/nidnoi';
import { normalizeAirline } from '../src/lib/sources/extract';

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
	it('does not invent seat counts when groupsize is 0 (unpublished)', () => {
		// fixture periods all have groupsize:0, so seats should be undefined, not a misleading 0
		expect(t?.periods.every((p) => p.seats === undefined)).toBe(true);
	});
	it('extracts the product image from the fixture', () => {
		expect(t?.image).toContain('ImageProduct/nidn261912');
	});
});

describe('parseNidnoi image extraction', () => {
	// Minimal HTML carrying just what the parser needs: og:title, one period, og:image.
	const withImg = (ogImage: string) =>
		`<meta property="og:title" content="ทัวร์ทดสอบ" />` +
		`<meta property="og:image" content="${ogImage}" />` +
		`"period_start_value":"2026-07-01","period_end_value":"2026-07-05","price_adults_double":9999`;
	const parse = (og: string) =>
		parseNidnoi(withImg(og), 'https://www.nidnoitravel.com/tour/NIDN260653/');

	it('handles og:image with a version-number extension (.1?v=39)', () => {
		// real failing case: URL ends in ".1?v=39", not a normal image extension
		const t = parse('https://www.nidnoitravel.com/wow/upload/5478/ImageProduct/nidn260653.1?v=39');
		expect(t?.image).toBe(
			'https://www.nidnoitravel.com/wow/upload/5478/ImageProduct/nidn260653.1?v=39'
		);
	});
	it('handles og:image with a .gif extension', () => {
		const t = parse('https://www.nidnoitravel.com/wow/upload/5478/ImageProduct/nidn262454.gif?v=32');
		expect(t?.image).toContain('nidn262454.gif');
	});
	it('keeps a normal .png og:image', () => {
		const t = parse('https://www.nidnoitravel.com/wow/upload/5478/ImageProduct/nidn1.png?v=1');
		expect(t?.image).toContain('nidn1.png');
	});
});

describe('normalizeAirline', () => {
	it('maps logo filenames/codes to readable names', () => {
		expect(normalizeAirline('vz_logo')).toBe('Thai Vietjet (VZ)');
		expect(normalizeAirline('cz_logo_blue')).toBe('China Southern (CZ)');
		expect(normalizeAirline('airasia-logo.svg?v=2')).toBe('AirAsia');
		expect(normalizeAirline('sichuan-airlines.jpg?v=2')).toBe('Sichuan Airlines (3U)');
	});
	it('keeps already-readable names', () => {
		expect(normalizeAirline('CHINA SOUTHERN AIRLINES (CZ)')).toBe('CHINA SOUTHERN AIRLINES (CZ)');
	});
	it('returns undefined for unknown junk (so the field is hidden)', () => {
		expect(normalizeAirline('xyz_logo')).toBeUndefined();
		expect(normalizeAirline(undefined)).toBeUndefined();
	});
});
