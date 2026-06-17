import { describe, it, expect } from 'vitest';
import { brandLogo, letterMark, hashString } from '../src/lib/birthday/logo';

describe('brandLogo', () => {
	it('returns undefined without a domain (caller uses letter-mark)', () => {
		expect(brandLogo(undefined)).toBeUndefined();
		expect(brandLogo('')).toBeUndefined();
	});

	it('proxies the Clearbit logo through wsrv with the domain encoded', () => {
		const url = brandLogo('starbucks.co.th', 96);
		expect(url).toContain('https://wsrv.nl/?url=');
		expect(url).toContain(encodeURIComponent('https://logo.clearbit.com/starbucks.co.th'));
		expect(url).toContain('w=96');
		expect(url).toContain('output=webp');
	});
});

describe('hashString', () => {
	it('is deterministic and non-negative', () => {
		expect(hashString('Starbucks')).toBe(hashString('Starbucks'));
		expect(hashString('Starbucks')).toBeGreaterThanOrEqual(0);
	});
	it('differs for different inputs', () => {
		expect(hashString('Starbucks')).not.toBe(hashString('Burger King'));
	});
});

describe('letterMark', () => {
	it('takes the first character, uppercased, with a stable color', () => {
		const a = letterMark('Starbucks');
		expect(a.initial).toBe('S');
		expect(a.color).toMatch(/^#[0-9a-f]{6}$/i);
		// stable across calls
		expect(letterMark('Starbucks').color).toBe(a.color);
	});
	it('handles Thai brand names', () => {
		const m = letterMark('สวนสยาม');
		expect(m.initial).toBe('ส');
		expect(m.color).toMatch(/^#[0-9a-f]{6}$/i);
	});
	it('falls back to ? on empty input', () => {
		expect(letterMark('   ').initial).toBe('?');
	});
});
