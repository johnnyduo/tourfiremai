import { error } from '@sveltejs/kit';
import { loadDeals } from '$lib/data';

export const prerender = true;

export async function entries() {
	const { deals } = await loadDeals();
	return deals.map((d) => ({ slug: d.slug }));
}

export async function load({ params }) {
	const { deals } = await loadDeals();
	const tour = deals.find((d) => d.slug === params.slug);
	if (!tour) throw error(404, 'ไม่พบทัวร์');
	return { tour };
}
