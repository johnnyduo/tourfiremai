import { loadBirthday } from '$lib/birthday/data';

export const prerender = true;

export const load = async () => {
	const file = await loadBirthday();
	return { promos: file.promos, generatedAt: file.generatedAt };
};
