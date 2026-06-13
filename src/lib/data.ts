import type { Tour } from './types';
import deals from '../../static/data/deals.json';

export interface DealsFile {
	generatedAt: string;
	count: number;
	deals: Tour[];
}

export async function loadDeals(): Promise<DealsFile> {
	return deals as unknown as DealsFile;
}
