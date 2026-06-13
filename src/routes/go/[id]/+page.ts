import { error } from '@sveltejs/kit';
import { loadDeals } from '$lib/data';

export const prerender = true;

export async function entries() {
	const { deals } = await loadDeals();
	return deals.map((d) => ({ id: d.id }));
}

export async function load({ params }) {
	const { deals } = await loadDeals();
	const tour = deals.find((d) => d.id === params.id);
	if (!tour) throw error(404, 'ไม่พบทัวร์');
	return { url: tour.sourceUrl, title: tour.title };
}
