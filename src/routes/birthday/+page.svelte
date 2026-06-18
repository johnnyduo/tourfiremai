<script lang="ts">
	import { onMount } from 'svelte';
	import MonthTabs from '$lib/components/MonthTabs.svelte';
	import BirthdayCard from '$lib/components/BirthdayCard.svelte';
	import {
		currentMonth,
		monthSpecific,
		evergreenPromos,
		groupByCategory
	} from '$lib/birthday/select';
	import { SITE } from '$lib/site';
	import { faqJsonLd, breadcrumbJsonLd, ldJson } from '$lib/seo';

	export let data;
	const base = SITE.base;

	const MONTHS_TH = [
		'มกราคม',
		'กุมภาพันธ์',
		'มีนาคม',
		'เมษายน',
		'พฤษภาคม',
		'มิถุนายน',
		'กรกฎาคม',
		'สิงหาคม',
		'กันยายน',
		'ตุลาคม',
		'พฤศจิกายน',
		'ธันวาคม'
	];

	// Most perks are evergreen (valid in any birth month). A few are pinned to a specific
	// calendar month (e.g. bank campaigns that change monthly). The month selector surfaces
	// those month-specific extras; the evergreen catalogue stays the same below.
	let month = 6; // SSR default; corrected to the real current month on mount
	onMount(() => {
		month = currentMonth(new Date());
	});

	$: total = data.promos.length;
	$: special = monthSpecific(data.promos, month);
	$: evergreen = evergreenPromos(data.promos);
	$: groups = groupByCategory(evergreen);

	const faqs = [
		{
			q: 'โปรเดือนเกิดคืออะไร?',
			a: 'โปรเดือนเกิด คือสิทธิพิเศษที่แบรนด์ต่างๆ มอบให้ในเดือนเกิดของคุณ เช่น เครื่องดื่มฟรี ของหวานฟรี หรือส่วนลด มักรับสิทธิ์ผ่าน LINE หรือแอปของร้าน'
		},
		{
			q: 'รับสิทธิ์โปรเดือนเกิดอย่างไร?',
			a: 'ส่วนใหญ่ต้องเป็นสมาชิกและลงทะเบียนวันเกิดล่วงหน้าผ่าน LINE OA หรือแอปของแบรนด์ บางร้านมีเงื่อนไขระดับสมาชิกหรือยอดซื้อขั้นต่ำ โปรดยืนยันกับร้านค้าก่อนใช้สิทธิ์'
		}
	];
</script>

<svelte:head>
	<title
		>โปรเดือนเกิด 2026 — รวมสิทธิ์วันเกิด เครื่องดื่ม/ของกิน/ความงามฟรี | {SITE.name}</title
	>
	<meta
		name="description"
		content="รวมโปรเดือนเกิดจากแบรนด์ดังทั่วไทย เครื่องดื่มฟรี ของหวานฟรี ส่วนลดวันเกิด รับสิทธิ์ผ่าน LINE/แอป เลือกเดือนเกิดของคุณ อัปเดตล่าสุด 🎂"
	/>
	<link rel="canonical" href={`${base}/birthday`} />
	<meta property="og:title" content={`โปรเดือนเกิด — รวมสิทธิ์วันเกิดทั่วไทย | ${SITE.name}`} />
	<meta property="og:description" content="เลือกเดือนเกิดของคุณ ดูสิทธิ์ฟรีและส่วนลดจากแบรนด์ดัง 🎂" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="th_TH" />
	<meta property="og:url" content={`${base}/birthday`} />
	{@html `<script type="application/ld+json">${ldJson(faqJsonLd(faqs))}<\/script>`}
	{@html `<script type="application/ld+json">${ldJson(
		breadcrumbJsonLd([
			{ name: SITE.name, url: base },
			{ name: 'โปรเดือนเกิด', url: `${base}/birthday` }
		])
	)}<\/script>`}
</svelte:head>

<section class="hero">
	<h1>🎂 <span class="fire-text">โปรเดือนเกิด</span> — รวมสิทธิ์วันเกิดทั่วไทย</h1>
	<p>
		รวม {total} สิทธิ์วันเกิดจากแบรนด์ดัง — เครื่องดื่มฟรี ของหวานฟรี และส่วนลด ใช้ได้ในเดือนเกิดของคุณ ·
		อัปเดต {data.generatedAt} · โปรดยืนยันกับร้านค้า
	</p>
</section>

<div class="months">
	<p class="months-label">เลือกเดือนเกิดของคุณ</p>
	<MonthTabs bind:value={month} />
</div>

{#if special.length}
	<section class="cat special">
		<h2>✨ พิเศษเฉพาะเดือน{MONTHS_TH[month - 1]} <span class="count">{special.length}</span></h2>
		<p class="special-note">โปรที่มีเฉพาะช่วงเดือนนี้ — รีบใช้ก่อนหมดเขต</p>
		<div class="grid">
			{#each special as promo (promo.id)}
				<BirthdayCard {promo} />
			{/each}
		</div>
	</section>
{/if}

<section class="cat evergreen-head">
	<h2>🎂 ใช้ได้ทุกเดือนเกิด <span class="count">{evergreen.length}</span></h2>
	<p class="special-note">สิทธิ์เหล่านี้ใช้ได้ในเดือนเกิดของคุณ ไม่ว่าคุณเกิดเดือนไหน</p>
</section>

{#if groups.length}
	{#each groups as g (g.category)}
		<section class="cat">
			<h3 class="cat-h">{g.label} <span class="count">{g.items.length}</span></h3>
			<div class="grid">
				{#each g.items as promo (promo.id)}
					<BirthdayCard {promo} />
				{/each}
			</div>
		</section>
	{/each}
{:else}
	<p class="empty">กำลังรวบรวมโปรเดือนเกิด โปรดกลับมาใหม่อีกครั้ง 🎂</p>
{/if}

<section class="faq">
	<h2>คำถามที่พบบ่อย</h2>
	{#each faqs as f}
		<details><summary>{f.q}</summary><p>{f.a}</p></details>
	{/each}
</section>

<style>
	.hero {
		padding: 40px 0 20px;
	}
	.hero h1 {
		font-size: clamp(1.6rem, 4.5vw, 2.6rem);
		margin: 0 0 8px;
		line-height: 1.15;
	}
	.hero p {
		color: var(--muted);
		max-width: 640px;
	}
	.months {
		position: sticky;
		top: 62px;
		background: color-mix(in srgb, var(--bg) 90%, transparent);
		backdrop-filter: blur(8px);
		z-index: 5;
		padding-top: 10px;
	}
	.months-label {
		margin: 0 0 6px;
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.cat {
		margin-top: 26px;
	}
	.cat h2,
	.cat .cat-h {
		font-size: 1.25rem;
		margin: 0 0 14px;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.cat .cat-h {
		font-size: 1.05rem;
	}
	.cat .count {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--muted);
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 1px 9px;
	}
	/* month-specific highlight block */
	.special {
		margin-top: 22px;
		padding: 18px;
		border: 1px solid color-mix(in srgb, var(--fire2) 35%, var(--line));
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--fire1) 7%, transparent);
	}
	.special h2 {
		margin-bottom: 6px;
	}
	.special-note {
		margin: 0 0 14px;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.evergreen-head {
		margin-top: 34px;
		border-top: 1px solid var(--line);
		padding-top: 22px;
	}
	.evergreen-head .special-note {
		margin-bottom: 0;
	}
	.empty {
		padding: 50px 0;
		text-align: center;
		color: var(--muted);
	}
	.faq {
		margin-top: 48px;
	}
	.faq h2 {
		font-size: 1.4rem;
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
