import { loadDeals } from '$lib/data';
import { COUNTRY_LABELS } from '$lib/countries';

export const prerender = true;

export async function GET() {
	const base = 'https://tourfiremai.com';
	const { deals } = await loadDeals();
	const urls = [
		`${base}/`,
		`${base}/birthday`,
		`${base}/search`,
		...Object.keys(COUNTRY_LABELS).map((c) => `${base}/destination/${c}`),
		...deals.map((d) => `${base}/tour/${d.slug}`)
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
		.map((u) => `<url><loc>${u}</loc><changefreq>daily</changefreq></url>`)
		.join('')}</urlset>`;
	return new Response(xml, { headers: { 'content-type': 'application/xml' } });
}
