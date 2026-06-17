export const prerender = true;

export const GET = async () =>
	new Response(
		`# TionPromo (ชั่นโปรโม)
TionPromo รวมโปรโมชันทั่วไทย แบ่งเป็น 2 ส่วนย่อย:
- 🔥 ทัวร์ไฟไหม้ (last-minute / discounted tour packages) จากบริษัททัวร์ไทยชั้นนำ จัดอันดับตามความเร่งด่วน (ใกล้วันเดินทาง + ที่นั่งเหลือน้อย) และราคา (ถูกเทียบกับค่ามัธยฐานของประเทศ + ส่วนลด) อัปเดตอัตโนมัติทุกวัน
- 🎂 โปรเดือนเกิด (birthday-month promotions) รวมสิทธิ์วันเกิดจากแบรนด์ดังทั่วไทย เครื่องดื่ม/ของกินฟรี ส่วนลด รับสิทธิ์ผ่าน LINE/แอป เลือกตามเดือนเกิด

## Tour sources
- นิดหน่อยทราเวล (Nidnoi Travel)
- ทราเวลซี้ด (Travelzeed)
- ยูนิไทยทราเวล (Unithai Travel)
- อัพ-โอเปอเรชั่น (Up-Operation / tourfiremai.com)

## Pages
- / (ทัวร์ไฟไหม้)
- /birthday (โปรเดือนเกิด)
- /search
- /sitemap.xml

## Model
TionPromo เป็นผู้รวบรวมข้อมูล (aggregator) ไม่ได้รับจอง ชำระเงิน หรือออกสิทธิ์เอง ลิงก์ทุกรายการชี้ไปยังร้านค้า/บริษัทต้นทางโดยตรง ข้อมูลโปรเดือนเกิดเป็นการรวบรวมแบบคัดสรร โปรดยืนยันเงื่อนไขกับร้านค้าก่อนใช้สิทธิ์
`,
		{ headers: { 'content-type': 'text/plain; charset=utf-8' } }
	);
