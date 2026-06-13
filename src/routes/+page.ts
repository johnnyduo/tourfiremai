import type { DealsFile } from '$lib/data';

export const load = async ({ parent }) => {
	const { file } = (await parent()) as { file: DealsFile };
	return { deals: file.deals, generatedAt: file.generatedAt };
};
