import type { RawTour, SourceId } from '../types';

export interface Adapter {
	id: SourceId;
	label: string; // Thai operator name
	enabled: boolean;
	discover(): Promise<string[]>; // tour URLs/codes
	fetchOne(ref: string): Promise<RawTour | null>;
}
