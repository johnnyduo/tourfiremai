<script lang="ts">
	import DealGrid from '$lib/components/DealGrid.svelte';
	import { itemListJsonLd, faqJsonLd, ldJson } from '$lib/seo';
	export let data;
	const base = 'https://tourfiremai.com';

	const faqs = [
		{
			q: 'ทัวร์ไฟไหม้คืออะไร?',
			a: 'ทัวร์ไฟไหม้ คือแพ็กเกจทัวร์ที่ลดราคาพิเศษเพราะใกล้วันเดินทางหรือที่นั่งใกล้เต็ม บริษัททัวร์ต้องการปิดกรุ๊ปจึงลดราคาลงมาก เหมาะกับคนที่ยืดหยุ่นเรื่องวันเดินทาง'
		},
		{
			q: 'จองทัวร์ผ่าน TourFireMai อย่างไร?',
			a: 'TourFireMai เป็นเว็บรวบรวมและจัดอันดับดีลทัวร์ เมื่อพบทัวร์ที่ถูกใจ กดปุ่ม “จอง” เพื่อไปยังหน้าเว็บของบริษัททัวร์ต้นทางและทำการจองกับบริษัทนั้นโดยตรง'
		},
		{
			q: 'ข้อมูลราคาและที่นั่งอัปเดตบ่อยแค่ไหน?',
			a: 'ระบบดึงข้อมูลจากบริษัททัวร์ชั้นนำโดยอัตโนมัติทุกวัน เพื่อให้ราคาและจำนวนที่นั่งใกล้เคียงความจริงมากที่สุด แต่ควรยืนยันกับผู้ขายอีกครั้งก่อนตัดสินใจ'
		}
	];
</script>

<svelte:head>
	<title>TourFireMai — รวมทัวร์ไฟไหม้ ราคาถูก ที่นั่งเหลือน้อย อัปเดตทุกวัน</title>
	<meta
		name="description"
		content="รวมโปรทัวร์ไฟไหม้ ทัวร์ราคาถูกที่สุด ออกเดินทางด่วน ที่นั่งใกล้เต็ม จากบริษัททัวร์ชั้นนำของไทย จัดอันดับอัตโนมัติด้วยคะแนนความร้อนแรง 🔥"
	/>
	<link rel="canonical" href={base} />
	<meta property="og:title" content="TourFireMai — รวมทัวร์ไฟไหม้ ราคาถูกที่สุดในไทย" />
	<meta property="og:description" content="ดีลทัวร์ที่ร้อนแรงที่สุด อัปเดตทุกวัน" />
	<meta property="og:type" content="website" />
	{@html `<script type="application/ld+json">${ldJson(itemListJsonLd(data.deals.slice(0, 30), base))}<\/script>`}
	{@html `<script type="application/ld+json">${ldJson(faqJsonLd(faqs))}<\/script>`}
</svelte:head>

<section class="hero">
	<h1><span class="fire-text">ทัวร์ไฟไหม้</span> 🔥 ดีลที่ร้อนแรงที่สุดในไทย</h1>
	<p>
		รวมทัวร์ราคาถูก ออกเดินทางด่วน ที่นั่งเหลือน้อย จากบริษัททัวร์ชั้นนำ —
		คัดและจัดอันดับอัตโนมัติด้วยคะแนนความร้อนแรง
	</p>
</section>

<DealGrid deals={data.deals}>
	<p slot="empty" class="empty">กำลังรวบรวมดีลทัวร์ล่าสุด โปรดกลับมาใหม่อีกครั้ง 🔥</p>
</DealGrid>

<section class="faq">
	<h2>คำถามที่พบบ่อย</h2>
	{#each faqs as f}
		<details>
			<summary>{f.q}</summary>
			<p>{f.a}</p>
		</details>
	{/each}
</section>

<style>
	.hero {
		padding: 48px 0 28px;
	}
	.hero h1 {
		font-size: clamp(1.8rem, 5vw, 3rem);
		margin: 0 0 10px;
		line-height: 1.15;
	}
	.hero p {
		color: var(--muted);
		max-width: 640px;
		font-size: 1.05rem;
	}
	.empty {
		padding: 60px 0;
		text-align: center;
		color: var(--muted);
	}
	.faq {
		margin-top: 56px;
	}
	.faq h2 {
		font-size: 1.5rem;
	}
	details {
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 14px 18px;
		margin-bottom: 10px;
		background: var(--card);
	}
	summary {
		font-weight: 700;
		cursor: pointer;
	}
	details p {
		color: var(--muted);
		margin: 10px 0 0;
	}
</style>
