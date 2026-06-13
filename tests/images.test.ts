import { describe, it, expect } from 'vitest';
import { proxyImage } from '../src/lib/images';

describe('proxyImage', () => {
	it('wraps a url through wsrv.nl with webp output', () => {
		const u = proxyImage('https://x.com/a.jpg', 640);
		expect(u).toContain('wsrv.nl');
		expect(u).toContain(encodeURIComponent('https://x.com/a.jpg'));
		expect(u).toContain('output=webp');
		expect(u).toContain('w=640');
	});
	it('returns placeholder when src missing', () => {
		expect(proxyImage(undefined, 640)).toContain('placeholder');
	});
});
