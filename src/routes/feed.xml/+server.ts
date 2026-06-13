import { loadDeals } from '$lib/data';

export const prerender = true;

function escapeXml(s: string): string {
	return s.replace(
		/[<>&'"]/g,
		(c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!
	);
}

export async function GET() {
	const base = 'https://tourfiremai.com';
	const { deals, generatedAt } = await loadDeals();
	const items = deals
		.slice(0, 50)
		.map(
			(d) =>
				`<item><title>${escapeXml(d.title)}</title><link>${base}/tour/${d.slug}</link><guid isPermaLink="false">${d.id}</guid><description>${escapeXml(
					`เริ่ม ฿${d.priceFrom.toLocaleString('th-TH')}${d.discountPct ? ` ลด ${d.discountPct}%` : ''}`
				)}</description></item>`
		)
		.join('');
	const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>TourFireMai — ทัวร์ไฟไหม้</title><link>${base}</link><description>รวมทัวร์ราคาถูก ที่นั่งเหลือน้อย อัปเดตทุกวัน</description><lastBuildDate>${generatedAt}</lastBuildDate>${items}</channel></rss>`;
	return new Response(xml, { headers: { 'content-type': 'application/rss+xml' } });
}
