export const prerender = true;

// Allow real search + AI-answer crawlers (needed for SEO/AEO/GEO).
const ALLOW = [
	'Googlebot',
	'Googlebot-Image',
	'Bingbot',
	'DuckDuckBot',
	'Applebot',
	'GPTBot',
	'OAI-SearchBot',
	'ChatGPT-User',
	'PerplexityBot',
	'ClaudeBot',
	'Claude-Web',
	'Google-Extended'
];

// Block known bulk scrapers / SEO data harvesters / generic HTTP libraries.
const BLOCK = [
	'AhrefsBot',
	'SemrushBot',
	'MJ12bot',
	'DotBot',
	'DataForSeoBot',
	'BLEXBot',
	'PetalBot',
	'SeznamBot',
	'serpstatbot',
	'Bytespider',
	'ZoominfoBot',
	'python-requests',
	'python-httpx',
	'Scrapy',
	'node-fetch',
	'axios',
	'Go-http-client',
	'curl',
	'Wget',
	'HeadlessChrome',
	'PhantomJS'
];

export const GET = async () => {
	const allowed = ALLOW.map((ua) => `User-agent: ${ua}\nAllow: /\nDisallow: /go/\nDisallow: /api/\n`).join(
		'\n'
	);
	const blocked = BLOCK.map((ua) => `User-agent: ${ua}\nDisallow: /\n`).join('\n');
	// Default: allow indexing of pages, but keep redirect + api endpoints out.
	const fallback = `User-agent: *\nAllow: /\nDisallow: /go/\nDisallow: /api/\n`;
	const body = `${allowed}\n${blocked}\n${fallback}\nSitemap: https://tourfiremai.com/sitemap.xml\n`;
	return new Response(body, { headers: { 'content-type': 'text/plain' } });
};
