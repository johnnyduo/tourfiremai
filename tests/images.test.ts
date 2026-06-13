import { describe, it, expect } from 'vitest';
import { proxyImage, CARD_RATIO } from '../src/lib/images';

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
	it('crops server-side to a top-anchored aspect ratio when ratio given', () => {
		const u = proxyImage('https://x.com/a.jpg', 480, CARD_RATIO);
		expect(u).toContain('w=480');
		expect(u).toContain('h=300'); // 480 / 1.6
		expect(u).toContain('fit=cover');
		expect(u).toContain('a=top');
	});
	it('does not crop when no ratio is given (full image for social)', () => {
		const u = proxyImage('https://x.com/a.jpg', 1200);
		expect(u).not.toContain('fit=cover');
		expect(u).not.toContain('a=top');
	});
});
