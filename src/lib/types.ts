export type SourceId = 'nidnoi' | 'travelzeed' | 'unithai' | 'uphol';

export interface Period {
	departISO: string;
	returnISO?: string;
	price: number; // THB
	priceBefore?: number;
	seats?: number;
	soldOut?: boolean;
}

export interface RawTour {
	source: SourceId;
	sourceId: string;
	sourceUrl: string;
	title: string;
	description?: string;
	highlights?: string[];
	countryRaw?: string;
	city?: string;
	image?: string;
	airline?: string;
	nights?: number;
	days?: number;
	periods: Period[];
}

export interface Tour extends RawTour {
	id: string; // `${source}-${sourceId}`
	slug: string;
	country: string; // normalized key
	priceFrom: number;
	discountPct?: number;
	nextDepartISO?: string;
	fetchedAtISO: string;
	urgencyScore: number;
	dealScore: number;
	fireScore: number;
}
