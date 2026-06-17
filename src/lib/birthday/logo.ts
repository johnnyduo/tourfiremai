/**
 * Brand logo helpers for the โปรเดือนเกิด cards.
 *
 * Real logos come from Clearbit's free logo endpoint (`logo.clearbit.com/<domain>`)
 * proxied + optimized through wsrv.nl (same CDN the tour images use, so it's cached
 * and served as webp). When a promo has no `domain` — or the proxied image fails to
 * load — the UI falls back to a deterministic letter-mark (see `letterMark`).
 */

/**
 * Proxied Clearbit logo URL for a brand domain, or `undefined` when no domain is set
 * (the caller should render a letter-mark instead).
 */
export function brandLogo(domain: string | undefined, size = 96): string | undefined {
	if (!domain) return undefined;
	const src = `https://logo.clearbit.com/${domain}`;
	return (
		`https://wsrv.nl/?url=${encodeURIComponent(src)}` +
		`&w=${size}&h=${size}&fit=contain&output=webp&we=1&n=-1&maxage=1y`
	);
}

// Warm, on-brand palette (matches the fire/celebration theme). Picked by hash so a
// given brand always gets the same colour across renders and sessions.
const MARK_COLORS = [
	'#ff5a3c',
	'#e0218a',
	'#ffb020',
	'#1a9d5a',
	'#3b82f6',
	'#8b5cf6',
	'#ef4444',
	'#0ea5e9'
];

/** Deterministic non-negative hash of a string (FNV-1a-ish). */
export function hashString(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

export interface LetterMark {
	initial: string;
	color: string;
}

/**
 * Letter-mark for a brand: the first meaningful character (Thai or Latin) plus a
 * stable colour from the brand name. Used as the logo fallback.
 */
export function letterMark(brand: string): LetterMark {
	const trimmed = brand.trim();
	const initial = trimmed ? Array.from(trimmed)[0].toUpperCase() : '?';
	const color = MARK_COLORS[hashString(trimmed) % MARK_COLORS.length];
	return { initial, color };
}
