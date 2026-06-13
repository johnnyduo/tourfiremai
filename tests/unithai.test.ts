import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseUnithai } from '../src/lib/sources/unithai';

// Fixtures were saved as UTF-8 (the live site declares charset=utf-8).
const detail = readFileSync('tests/fixtures/unithai-detail.html', 'utf8');
const book = readFileSync('tests/fixtures/unithai-book.html', 'utf8');

describe('parseUnithai', () => {
	const t = parseUnithai(detail, book, '51004');
	it('extracts id + readable Thai title', () => {
		expect(t?.sourceId).toBe('51004');
		expect(t?.title).toContain('ทัวร์');
	});
	it('extracts days/nights from title', () => {
		expect(t?.days).toBe(5);
		expect(t?.nights).toBe(4);
	});
	it('extracts a starting price >= 3000', () => {
		expect(t?.periods[0].price).toBeGreaterThanOrEqual(3000);
		expect(t?.periods[0].price).toBeLessThanOrEqual(500000);
	});
	it('builds the source URL', () =>
		expect(t?.sourceUrl).toContain('trip_detail2.php?route_id=51004'));
});
