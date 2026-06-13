import { describe, it, expect } from 'vitest';
import { normalizeCountry } from '../src/lib/countries';

describe('normalizeCountry', () => {
	it('maps Thai names', () => {
		expect(normalizeCountry('ทัวร์จีน ฉงชิ่ง')).toBe('china');
		expect(normalizeCountry('ทัวร์ญี่ปุ่น โอซาก้า')).toBe('japan');
		expect(normalizeCountry('เกาหลีใต้')).toBe('korea');
	});
	it('falls back to "other"', () => {
		expect(normalizeCountry('ดาวอังคาร')).toBe('other');
	});
});
