<script lang="ts">
	import DealGrid from '$lib/components/DealGrid.svelte';
	export let data;
	const base = 'https://tourfiremai.com';
</script>

<svelte:head>
	<title>ทัวร์{data.label}ไฟไหม้ ราคาถูก ที่นั่งเหลือน้อย | TourFireMai</title>
	<meta
		name="description"
		content={`รวมทัวร์${data.label}ราคาถูก โปรไฟไหม้ ออกเดินทางด่วน ที่นั่งใกล้เต็ม จากบริษัททัวร์ชั้นนำ จัดอันดับอัตโนมัติ — ${data.deals.length} ดีล`}
	/>
	<link rel="canonical" href={`${base}/destination/${data.country}`} />
</svelte:head>

<section class="hd">
	<h1>ทัวร์<span class="fire-text">{data.label}</span>ไฟไหม้ 🔥</h1>
	<p>{data.deals.length} ดีล — เรียงตามความร้อนแรง (ใกล้เดินทาง + ราคาดี + ที่นั่งเหลือน้อย)</p>
</section>

<DealGrid deals={data.deals}>
	<p slot="empty" class="empty">ยังไม่มีดีลทัวร์{data.label}ในขณะนี้ — กลับมาดูใหม่เร็วๆ นี้</p>
</DealGrid>

<style>
	.hd {
		padding: 40px 0 22px;
	}
	.hd h1 {
		font-size: clamp(1.6rem, 4.5vw, 2.6rem);
		margin: 0 0 8px;
	}
	.hd p {
		color: var(--muted);
	}
	.empty {
		padding: 60px 0;
		text-align: center;
		color: var(--muted);
	}
</style>
