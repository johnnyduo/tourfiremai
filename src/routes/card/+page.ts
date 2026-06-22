import { loadCardPromos } from '$lib/card/data';

export const prerender = true;

export const load = async () => {
	const file = await loadCardPromos();
	return { promos: file.promos, generatedAt: file.generatedAt };
};
