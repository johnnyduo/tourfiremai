import { loadDeals } from '$lib/data';
import { COUNTRY_LABELS } from '$lib/countries';

export const prerender = true;

export const entries = () => Object.keys(COUNTRY_LABELS).map((country) => ({ country }));

export async function load({ params }) {
	const { deals } = await loadDeals();
	return {
		country: params.country,
		label: COUNTRY_LABELS[params.country] ?? params.country,
		deals: deals.filter((d) => d.country === params.country)
	};
}
