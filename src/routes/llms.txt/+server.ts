export const prerender = true;

export const GET = async () =>
	new Response(
		`# TourFireMai
รวมทัวร์ไฟไหม้ (last-minute / discounted tour packages) จากบริษัททัวร์ไทยชั้นนำ จัดอันดับตามความเร่งด่วน (ใกล้วันเดินทาง + ที่นั่งเหลือน้อย) และราคา (ถูกเทียบกับค่ามัธยฐานของประเทศ + ส่วนลด) อัปเดตอัตโนมัติทุกวัน

## Sources
- นิดหน่อยทราเวล (Nidnoi Travel)
- ทราเวลซี้ด (Travelzeed)
- ยูนิไทยทราเวล (Unithai Travel)
- อัพ-โอเปอเรชั่น (Up-Operation / tourfiremai.com)

## Pages
- /sitemap.xml

## Model
TourFireMai เป็นผู้รวบรวมข้อมูล (aggregator) ไม่ได้รับจองหรือชำระเงินเอง ลิงก์ทุกทัวร์ชี้ไปยังหน้าเว็บของบริษัททัวร์ต้นทางโดยตรง
`,
		{ headers: { 'content-type': 'text/plain; charset=utf-8' } }
	);
