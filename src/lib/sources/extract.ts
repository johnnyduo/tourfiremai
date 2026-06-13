/** Shared HTML field-extraction helpers for adapters. */

const decodeEntities = (s: string) =>
	s
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
		.replace(/&nbsp;/g, ' ');

/** Pull a meta description (name="description" or og:description), any attr order. */
export function metaDescription(html: string): string | undefined {
	const patterns = [
		/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]*content=["']([^"']{15,})["']/i,
		/<meta[^>]+content=["']([^"']{15,})["'][^>]*(?:name|property)=["'](?:og:)?description["']/i
	];
	for (const re of patterns) {
		const m = html.match(re);
		if (m) {
			const d = decodeEntities(m[1]).replace(/\s+/g, ' ').trim();
			if (d.length >= 15) return d.slice(0, 320);
		}
	}
	return undefined;
}

/** Split a "·"/"•"-separated highlight string into a clean list. */
export function splitHighlights(s: string | undefined, max = 6): string[] | undefined {
	if (!s) return undefined;
	const parts = s
		.split(/[·•|]/)
		.map((p) => p.replace(/^[\s✈🚌🏨🌟⭐️-]+/, '').trim())
		.filter((p) => p.length >= 4 && p.length <= 80);
	return parts.length ? parts.slice(0, max) : undefined;
}

const COUNTRY_TH: Record<string, string> = {
	china: 'จีน',
	japan: 'ญี่ปุ่น',
	korea: 'เกาหลี',
	vietnam: 'เวียดนาม',
	hongkong: 'ฮ่องกง',
	taiwan: 'ไต้หวัน',
	singapore: 'สิงคโปร์',
	europe: 'ยุโรป',
	thailand: 'ไทย',
	other: 'ต่างประเทศ'
};

/** Build a clean Thai description from structured fields when none is scrapeable. */
export function synthDescription(o: {
	title: string;
	country: string;
	days?: number;
	nights?: number;
	airline?: string;
	priceFrom: number;
	operator: string;
}): string {
	const dest = COUNTRY_TH[o.country] ?? 'ต่างประเทศ';
	const dur = o.days ? `${o.days} วัน${o.nights ? ` ${o.nights} คืน` : ''}` : '';
	const air = o.airline ? ` เดินทางโดยสายการบิน ${o.airline}` : '';
	return (
		`${o.title} — แพ็กเกจทัวร์${dest}${dur ? ` ${dur}` : ''} ราคาเริ่มต้น ` +
		`฿${o.priceFrom.toLocaleString('th-TH')} ต่อท่าน${air} โดย ${o.operator} ` +
		`รวมโปรไฟไหม้ลดราคาพิเศษ จองด่วนก่อนที่นั่งเต็ม`
	).slice(0, 320);
}
