export const prerender = true;

export const GET = async () =>
	new Response(`User-agent: *\nAllow: /\nSitemap: https://tourfiremai.com/sitemap.xml\n`, {
		headers: { 'content-type': 'text/plain' }
	});
