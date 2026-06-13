export function proxyImage(src: string | undefined, w = 640, q = 60): string {
	if (!src) return `https://wsrv.nl/?url=&placeholder=true&w=${w}`;
	return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${w}&q=${q}&output=webp&we=1&maxage=1y`;
}
