/**
 * Proxy + optimize an operator image through wsrv.nl.
 * - output=webp + q: small, modern format
 * - we=1: don't enlarge past the source
 * - maxage=1y + default: long CDN cache (warm hits are ~0.1s)
 * - n=-1: keep retrying flaky origins
 * - il: interlaced/progressive so the image appears sooner while loading
 */
export function proxyImage(src: string | undefined, w = 640, q = 58): string {
	if (!src) return `https://wsrv.nl/?url=&output=webp&w=${w}&h=${Math.round(w * 0.625)}&fit=cover`;
	return (
		`https://wsrv.nl/?url=${encodeURIComponent(src)}` +
		`&w=${w}&q=${q}&output=webp&we=1&il&n=-1&maxage=1y`
	);
}

/** Bare list of proxy URLs to pre-warm wsrv's cache after a data refresh. */
export function warmUrls(images: Array<string | undefined>, widths = [480, 768, 1080]): string[] {
	const out: string[] = [];
	for (const src of images) {
		if (!src) continue;
		for (const w of widths) out.push(proxyImage(src, w));
	}
	return [...new Set(out)];
}
