<script lang="ts">
	import TourCard from '$lib/components/TourCard.svelte';
	import { COUNTRY_LABELS } from '$lib/countries';
	import type { DealsFile } from '$lib/data';
	import type { Tour } from '$lib/types';
	export let data: { file: DealsFile };

	let country = '';
	let maxPrice = 0;
	let sort: 'fire' | 'price' | 'soon' = 'fire';

	const all: Tour[] = data.file.deals;
	const countries = [...new Set(all.map((d) => d.country))];

	$: filtered = all
		.filter((d) => (country ? d.country === country : true))
		.filter((d) => (maxPrice ? d.priceFrom <= maxPrice : true))
		.slice()
		.sort((a, b) => {
			if (sort === 'price') return a.priceFrom - b.priceFrom;
			if (sort === 'soon')
				return (
					new Date(a.nextDepartISO ?? '2999').getTime() -
					new Date(b.nextDepartISO ?? '2999').getTime()
				);
			return b.fireScore - a.fireScore;
		});
</script>

<svelte:head>
	<title>ค้นหาทัวร์ไฟไหม้ — กรองตามประเทศ ราคา วันเดินทาง | TourFireMai</title>
	<meta name="description" content="ค้นหาและกรองทัวร์ไฟไหม้ตามประเทศ งบประมาณ และความเร่งด่วน จากบริษัททัวร์ชั้นนำของไทย" />
	<meta name="robots" content="noindex,follow" />
</svelte:head>

<section class="hd">
	<h1>ค้นหาทัวร์ 🔥</h1>
	<div class="filters">
		<select bind:value={country} aria-label="ประเทศ">
			<option value="">ทุกประเทศ</option>
			{#each countries as c}
				<option value={c}>{COUNTRY_LABELS[c] ?? c}</option>
			{/each}
		</select>
		<select bind:value={maxPrice} aria-label="งบประมาณ">
			<option value={0}>ทุกราคา</option>
			<option value={10000}>ไม่เกิน ฿10,000</option>
			<option value={20000}>ไม่เกิน ฿20,000</option>
			<option value={40000}>ไม่เกิน ฿40,000</option>
		</select>
		<select bind:value={sort} aria-label="เรียงลำดับ">
			<option value="fire">🔥 ร้อนแรงสุด</option>
			<option value="price">ราคาถูกสุด</option>
			<option value="soon">ใกล้เดินทางสุด</option>
		</select>
	</div>
	<p class="count">{filtered.length} ดีล</p>
</section>

<div class="grid">
	{#each filtered as t (t.id)}
		<TourCard {t} />
	{/each}
</div>

<style>
	.hd {
		padding: 36px 0 18px;
	}
	.hd h1 {
		font-size: 1.8rem;
		margin: 0 0 14px;
	}
	.filters {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	select {
		font-family: inherit;
		font-size: 0.95rem;
		padding: 10px 14px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink);
	}
	.count {
		color: var(--muted);
		margin: 12px 0 0;
	}
</style>
