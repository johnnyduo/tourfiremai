import { loadDeals } from '$lib/data';

export const prerender = true;

export const load = async () => ({ file: await loadDeals() });
