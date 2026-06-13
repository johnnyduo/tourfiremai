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
	it('returns a safe fallback when src missing', () => {
		const u = proxyImage(undefined, 640);
		expect(u).toContain('wsrv.nl');
		expect(u).toContain('output=webp');
	});
	it('uses progressive + long cache for fast perceived load', () => {
		const u = proxyImage('https://x.com/a.jpg', 480);
		expect(u).toContain('&il');
		expect(u).toContain('maxage=1y');
	});
});
