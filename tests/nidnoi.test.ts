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
