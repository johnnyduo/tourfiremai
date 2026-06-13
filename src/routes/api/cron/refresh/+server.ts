import { json, error } from '@sveltejs/kit';
import { enabledAdapters } from '$lib/sources';
import { buildDeals } from '../../../../../scripts/refresh';

export const prerender = false;

/**
 * Manual / preview refresh trigger. Returns freshly-built deals as JSON.
 * The canonical scheduled updater that COMMITS deals.json is the GitHub
 * Action (.github/workflows/refresh.yml) — Vercel's runtime FS is ephemeral
 * so committing from here would not persist.
 */
export async function GET({ request, url }) {
	const secret = process.env.CRON_SECRET;
	const auth = request.headers.get('authorization');
	if (secret && auth !== `Bearer ${secret}` && url.searchParams.get('key') !== secret) {
		throw error(401, 'unauthorized');
	}
	const deals = await buildDeals(enabledAdapters());
	return json({
		ok: true,
		count: deals.length,
		generatedAt: new Date().toISOString(),
		deals: deals.slice(0, 100)
	});
}
