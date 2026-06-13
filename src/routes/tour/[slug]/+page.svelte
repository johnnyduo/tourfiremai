<script lang="ts">
	import { proxyImage } from '$lib/images';
	import { tourJsonLd } from '$lib/seo';
	import { COUNTRY_LABELS } from '$lib/countries';
	import { SOURCE_LABELS } from '$lib/sources-meta';
	import PriceTag from '$lib/components/PriceTag.svelte';
	import FireBadge from '$lib/components/FireBadge.svelte';
	import CountryChip from '$lib/components/CountryChip.svelte';
	export let data;
	$: t = data.tour;
	const base = 'https://tourfiremai.com';
</script>

<svelte:head>
	<title>{t.title} — เริ่ม ฿{t.priceFrom.toLocaleString('th-TH')} | TourFireMai</title>
	<meta
		name="description"
		content={`${t.title} ราคาเริ่มต้น ฿${t.priceFrom.toLocaleString('th-TH')} โดย ${SOURCE_LABELS[t.source] ?? t.source}${t.discountPct ? ` ลดสูงสุด ${t.discountPct}%` : ''}`}
	/>
	<link rel="canonical" href={`${base}/tour/${t.slug}`} />
	<meta property="og:title" content={t.title} />
	<meta property="og:type" content="product" />
	{#if t.image}<meta property="og:image" content={proxyImage(t.image, 1200)} />{/if}
	{@html `<script type="application/ld+json">${JSON.stringify(tourJsonLd(t, base))}<\/script>`}
</svelte:head>

<nav class="crumbs">
	<a href="/">หน้าแรก</a> ›
	<a href={`/destination/${t.country}`}>ทัวร์{COUNTRY_LABELS[t.country] ?? t.country}</a>
</nav>

<article class="detail">
	{#if t.image}<img src={proxyImage(t.image, 1080)} alt={t.title} />{/if}

	<div class="head">
		<CountryChip country={t.country} />
		<FireBadge score={t.fireScore} />
	</div>

	<h1>{t.title}</h1>

	<div class="meta">
		{#if t.days}{t.days} วัน{#if t.nights} {t.nights} คืน{/if}{/if}
		{#if t.airline} · บิน {t.airline}{/if}
	</div>

	<PriceTag price={t.priceFrom} discount={t.discountPct} />

	<h2>วันเดินทางและราคา</h2>
	<ul class="periods">
		{#each t.periods as p}
			<li class:soldout={p.soldOut}>
				<span>{new Date(p.departISO).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}{#if p.returnISO} – {new Date(p.returnISO).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}{/if}</span>
				<span class="p">฿{p.price.toLocaleString('th-TH')}</span>
				{#if p.soldOut}<span class="tag sold">เต็มแล้ว</span>
				{:else if p.seats != null && p.seats > 0 && p.seats <= 5}<span class="tag low">เหลือ {p.seats} ที่</span>{/if}
			</li>
		{/each}
	</ul>

	<a class="btn-fire" href={t.sourceUrl} target="_blank" rel="nofollow noopener">
		จองที่ {SOURCE_LABELS[t.source] ?? t.source} →
	</a>
	<p class="note">* TourFireMai เป็นผู้รวบรวมข้อมูล การจองและชำระเงินทำกับบริษัททัวร์ต้นทางโดยตรง ราคาและที่นั่งอาจเปลี่ยนแปลง</p>
</article>

<style>
	.crumbs {
		padding: 18px 0 0;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.crumbs a {
		text-decoration: none;
		color: var(--fire2);
	}
	.detail {
		padding: 16px 0 24px;
		max-width: 820px;
	}
	.detail img {
		width: 100%;
		border-radius: var(--radius);
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}
	.head {
		display: flex;
		gap: 10px;
		align-items: center;
		margin: 16px 0 8px;
	}
	h1 {
		font-size: clamp(1.4rem, 4vw, 2.1rem);
		line-height: 1.25;
		margin: 4px 0 10px;
	}
	.meta {
		color: var(--muted);
		margin-bottom: 14px;
	}
	h2 {
		font-size: 1.2rem;
		margin: 26px 0 10px;
	}
	.periods {
		list-style: none;
		padding: 0;
		margin: 0 0 26px;
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
	}
	.periods li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-bottom: 1px solid var(--line);
	}
	.periods li:last-child {
		border-bottom: 0;
	}
	.periods li.soldout {
		opacity: 0.55;
	}
	.periods .p {
		margin-left: auto;
		font-weight: 700;
		color: var(--fire2);
	}
	.tag {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 999px;
	}
	.tag.sold {
		background: var(--line);
		color: var(--muted);
	}
	.tag.low {
		background: rgba(224, 57, 43, 0.12);
		color: var(--red);
	}
	.note {
		color: var(--muted);
		font-size: 0.8rem;
		margin-top: 14px;
	}
</style>
