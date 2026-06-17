import { describe, it, expect } from 'vitest';
import { SITE } from '../src/lib/site';

describe('SITE', () => {
	it('exposes brand identity and base url', () => {
		expect(SITE.name).toBe('TionPromo');
		expect(SITE.nameTh).toBe('ชั่นโปรโม');
		expect(SITE.base).toBe('https://tourfiremai.com');
		expect(typeof SITE.tagline).toBe('string');
	});
});
