import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { discoverUpFromHtml, parseUpOperation } from '../src/lib/sources/upoperation';

const html = readFileSync('tests/fixtures/upoperation-home.html', 'utf8');

describe('discoverUpFromHtml', () => {
	const links = discoverUpFromHtml(html);
	it('finds tour/destination links', () => {
		expect(links.length).toBeGreaterThan(0);
		expect(links.every((u) => u.startsWith('https://www.tourfiremai.com/'))).toBe(true);
	});
});

describe('parseUpOperation', () => {
	it('returns null when no price is present', () => {
		expect(parseUpOperation('<title>ทัวร์ x :: y</title>', 'https://www.tourfiremai.com/cview/1')).toBe(
			null
		);
	});
	it('parses title + price when present', () => {
		const t = parseUpOperation(
			'<title>ทัวร์ญี่ปุ่น 5 วัน 3 คืน :: up</title> ราคา 25,900 บาท',
			'https://www.tourfiremai.com/cview/jp1'
		);
		expect(t?.source).toBe('uphol');
		expect(t?.title).toContain('ญี่ปุ่น');
		expect(t?.periods[0].price).toBe(25900);
		expect(t?.days).toBe(5);
	});
});
