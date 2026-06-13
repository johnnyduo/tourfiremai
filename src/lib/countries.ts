const MAP: Array<[RegExp, string]> = [
	[/จีน|china|ฉงชิ่ง|เซี่ยงไฮ้|ปักกิ่ง|จางเจียเจี้ย|คุนหมิง|เฉิงตู|กุ้ยหลิน/i, 'china'],
	[/ญี่ปุ่น|japan|โตเกียว|โอซาก้า|ฮอกไกโด|เกียวโต|นาโกย่า/i, 'japan'],
	[/เกาหลี|korea|โซล|ปูซาน/i, 'korea'],
	[/เวียดนาม|vietnam|ฮานอย|ดานัง|โฮจิมินห์|ซาปา/i, 'vietnam'],
	[/ฮ่องกง|hong ?kong|มาเก๊า|macau/i, 'hongkong'],
	[/ไต้หวัน|taiwan|ไทเป/i, 'taiwan'],
	[/สิงคโปร์|singapore/i, 'singapore'],
	[/ยุโรป|europe|อิตาลี|ฝรั่งเศส|สวิส|เยอรมัน|อังกฤษ/i, 'europe'],
	[/ไทย|thailand|กรุงเทพ|เชียงใหม่|อยุธยา|ภูเก็ต|กระบี่/i, 'thailand'],
];

export function normalizeCountry(raw = ''): string {
	for (const [re, key] of MAP) if (re.test(raw)) return key;
	return 'other';
}

export const COUNTRY_LABELS: Record<string, string> = {
	china: 'จีน',
	japan: 'ญี่ปุ่น',
	korea: 'เกาหลี',
	vietnam: 'เวียดนาม',
	hongkong: 'ฮ่องกง',
	taiwan: 'ไต้หวัน',
	singapore: 'สิงคโปร์',
	europe: 'ยุโรป',
	thailand: 'ไทย',
	other: 'อื่นๆ'
};
