import { describe, it, expect } from 'vitest';
import {
	PRESET_AMOUNTS,
	SATANG,
	promptPayPayload,
	qrDataUrl,
	buildDonationOptions
} from '../src/lib/support';

// CRC16/CCITT-FALSE — the checksum banks validate on an EMVCo QR.
function crc16(s: string): string {
	let c = 0xffff;
	for (let i = 0; i < s.length; i++) {
		c ^= s.charCodeAt(i) << 8;
		for (let j = 0; j < 8; j++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
	}
	return c.toString(16).toUpperCase().padStart(4, '0');
}

describe('preset amounts', () => {
	it('every preset ends in the .88 satang signature', () => {
		for (const a of PRESET_AMOUNTS) {
			expect(+(a % 1).toFixed(2)).toBe(SATANG);
		}
	});
	it('exposes the expected bases', () => {
		expect(PRESET_AMOUNTS).toEqual([50.88, 100.88, 200.88, 500.88]);
	});
});

describe('promptPayPayload', () => {
	const payload = promptPayPayload('0812345678', 200.88);
	it('is a valid EMVCo payload (starts with 00, has CRC tag 6304)', () => {
		expect(payload.startsWith('00')).toBe(true);
		expect(payload.slice(-8, -4)).toBe('6304');
	});
	it('embeds the exact amount including satang', () => {
		expect(payload).toContain('200.88');
	});
	it('has a correct CRC16 checksum (so banks accept the scan)', () => {
		const body = payload.slice(0, -4);
		expect(crc16(body)).toBe(payload.slice(-4));
	});
});

describe('qrDataUrl', () => {
	it('renders a PNG data URL', async () => {
		const url = await qrDataUrl(promptPayPayload('0812345678', 100.88));
		expect(url.startsWith('data:image/png;base64,')).toBe(true);
		expect(url.length).toBeGreaterThan(200);
	});
});

describe('buildDonationOptions', () => {
	it('builds one option per preset with label, amount and QR', async () => {
		const opts = await buildDonationOptions('0812345678');
		expect(opts.length).toBe(PRESET_AMOUNTS.length);
		expect(opts[0].label).toBe('50');
		expect(opts[0].amount).toBe(50.88);
		expect(opts[0].qr.startsWith('data:image/png;base64,')).toBe(true);
	});
});
