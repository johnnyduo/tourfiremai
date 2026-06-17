export type PromoCategory =
	| 'drinks'
	| 'food'
	| 'cosmetic'
	| 'entertainment'
	| 'shopping'
	| 'bank'
	| 'other';
export type PromoChannel = 'line' | 'app' | 'web' | 'instore' | 'card' | 'event';

export interface BirthdayPromo {
	id: string;
	brand: string;
	category: PromoCategory;
	channel: PromoChannel;
	channelLabel?: string;
	condition?: string;
	perk: string;
	evergreen: boolean;
	months?: number[]; // 1-12
	validUntilISO?: string;
	url?: string;
	note?: string;
	domain?: string; // brand domain for logo lookup, e.g. "starbucks.co.th"
}

export interface BirthdayFile {
	generatedAt: string;
	count: number;
	promos: BirthdayPromo[];
}

export const CATEGORY_ORDER: PromoCategory[] = [
	'drinks',
	'food',
	'cosmetic',
	'entertainment',
	'shopping',
	'bank',
	'other'
];

export const CATEGORY_LABELS: Record<PromoCategory, string> = {
	drinks: 'เครื่องดื่ม / ขนม',
	food: 'ของกิน',
	cosmetic: 'เครื่องสำอาง / ความงาม',
	entertainment: 'บันเทิง / ท่องเที่ยว',
	shopping: 'ช้อปปิ้ง',
	bank: 'ธนาคาร / บัตรเครดิต',
	other: 'อื่นๆ'
};

export const CHANNEL_LABELS: Record<PromoChannel, string> = {
	line: 'LINE',
	app: 'App',
	web: 'Web',
	instore: 'หน้าร้าน',
	card: 'บัตรเครดิต',
	event: 'หน้างาน'
};
