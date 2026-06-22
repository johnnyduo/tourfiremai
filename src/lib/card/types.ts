export type SpendCategory =
	| 'dining'
	| 'fuel'
	| 'shopping'
	| 'travel'
	| 'online'
	| 'grocery'
	| 'entertainment'
	| 'health'
	| 'other';

export interface CardPromo {
	id: string;
	bank: string; // "KTC", "SCB", "กรุงศรี"...
	cardName?: string; // ชื่อบัตร/โปรแกรมถ้ามี
	category: SpendCategory;
	perk: string; // ข้อความโปร (ไทย)
	merchant?: string; // ร้าน/แบรนด์ที่ร่วม
	condition?: string; // เงื่อนไข ยอดขั้นต่ำ
	validUntilISO?: string; // วันหมดเขต
	evergreen: boolean; // true = สิทธิประจำบัตร ไม่หมดเขต
	url?: string; // ลิงก์รายละเอียด
	domain?: string; // โลโก้ธนาคาร (Clearbit)
	note?: string;
}

export interface CardFile {
	generatedAt: string;
	count: number;
	promos: CardPromo[];
}

export const CATEGORY_ORDER: SpendCategory[] = [
	'dining',
	'fuel',
	'shopping',
	'grocery',
	'travel',
	'online',
	'entertainment',
	'health',
	'other'
];

export const CATEGORY_LABELS: Record<SpendCategory, string> = {
	dining: 'ร้านอาหาร',
	fuel: 'ปั๊มน้ำมัน',
	shopping: 'ช้อปปิ้ง / ห้าง',
	grocery: 'ซูเปอร์มาร์เก็ต',
	travel: 'ท่องเที่ยว / โรงแรม / สายการบิน',
	online: 'ออนไลน์',
	entertainment: 'หนัง / ความบันเทิง',
	health: 'สุขภาพ / ประกัน',
	other: 'อื่นๆ'
};

export const CATEGORY_ICONS: Record<SpendCategory, string> = {
	dining: '🍽️',
	fuel: '⛽',
	shopping: '🛍️',
	grocery: '🛒',
	travel: '✈️',
	online: '💻',
	entertainment: '🎬',
	health: '🏥',
	other: '💳'
};
