/**
 * Proxy + optimize an operator image through wsrv.nl.
 * - output=webp + q: small, modern format
 * - we=1: don't enlarge past the source
 * - maxage=1y: long CDN cache (warm hits are ~0.1s)
 * - n=-1: keep retrying flaky origins
 * - il: interlaced/progressive so the image appears sooner while loading
 *
 * When `ratio` is given we crop SERVER-SIDE to that aspect (fit=cover, a=top):
 * square operator covers (Nidnoi/Unithai 1:1) and wide ones (Travelzeed 16:8.4)
 * all come out the exact same shape, anchored at the top so the destination
 * title/header is never cut off — and the browser only downloads the cropped
 * pixels, so it's faster too.
 */
export function proxyImage(src: string | undefined, w = 640, ratio = 0, q = 58): string {
	const h = ratio ? Math.round(w / ratio) : 0;
	const crop = h ? `&h=${h}&fit=cover&a=top` : '';
	if (!src) {
		return `https://wsrv.nl/?url=&output=webp&w=${w}${h ? `&h=${h}&fit=cover` : ''}`;
	}
	return (
		`https://wsrv.nl/?url=${encodeURIComponent(src)}` +
		`&w=${w}${crop}&q=${q}&output=webp&we=1&il&n=-1&maxage=1y`
	);
}

// aspect ratios used across the UI
export const CARD_RATIO = 16 / 10;
export const HERO_RATIO = 16 / 9;

/** Proxy URLs to pre-warm wsrv's cache after a data refresh (card + hero crops). */
export function warmUrls(images: Array<string | undefined>): string[] {
	const out: string[] = [];
	for (const src of images) {
		if (!src) continue;
		out.push(proxyImage(src, 480, CARD_RATIO));
		out.push(proxyImage(src, 768, CARD_RATIO));
		out.push(proxyImage(src, 1080, HERO_RATIO));
	}
	return [...new Set(out)];
}
