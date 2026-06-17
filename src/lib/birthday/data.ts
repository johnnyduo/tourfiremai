import type { BirthdayFile } from './types';
import file from '../../../static/data/birthday.json';

export async function loadBirthday(): Promise<BirthdayFile> {
	return file as unknown as BirthdayFile;
}
