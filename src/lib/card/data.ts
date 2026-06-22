import type { CardFile } from './types';
import file from '../../../static/data/card.json';

export async function loadCardPromos(): Promise<CardFile> {
	return file as unknown as CardFile;
}
