<script lang="ts">
	import { onMount } from 'svelte';
	import MonthTabs from '$lib/components/MonthTabs.svelte';
	import BirthdayCard from '$lib/components/BirthdayCard.svelte';
	import {
		currentMonth,
		promosForBirthMonth,
		promosForCalendarMonth,
		groupByCategory
	} from '$lib/birthday/select';
	import { SITE } from '$lib/site';
	import { faqJsonLd, breadcrumbJsonLd, ldJson } from '$lib/seo';

	export let data;
	const base = SITE.base;

	let month = 6; // SSR default; corrected to real current month on mount
	let view: 'birth' | 'calendar' = 'birth';
	onMount(() => {
		month = currentMonth(new Date());
	});

	$: selected =
		view === 'birth'
			? promosForBirthMonth(data.promos, month)
			: promosForCalendarMonth(data.promos, month, new Date());
	$: groups = groupByCategory(selected);

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
		เลือกเดือนเกิดของคุณ แล้วดูสิทธิ์ฟรีและส่วนลดจากแบรนด์ดัง · อัปเดต {data.generatedAt} ·
		โปรดยืนยันกับร้านค้า
	</p>
</section>

<div class="controls">
	<div class="view">
		<button class:active={view === 'birth'} on:click={() => (view = 'birth')}>เดือนเกิดฉัน</button>
		<button class:active={view === 'calendar'} on:click={() => (view = 'calendar')}>โปรเดือนนี้</button
		>
	</div>
	<MonthTabs bind:value={month} />
</div>

{#if groups.length}
	{#each groups as g (g.category)}
		<section class="cat">
			<h2>{g.label}</h2>
			<div class="grid">
				{#each g.items as promo (promo.id)}
					<BirthdayCard {promo} />
				{/each}
			</div>
		</section>
	{/each}
{:else}
	<p class="empty">ยังไม่มีโปรเดือนเกิดสำหรับเดือนนี้ 🎂</p>
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
	.controls {
		position: sticky;
		top: 62px;
		background: color-mix(in srgb, var(--bg) 90%, transparent);
		backdrop-filter: blur(8px);
		z-index: 5;
		padding-top: 10px;
	}
	.view {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}
	.view button {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--muted);
		border-radius: 999px;
		padding: 7px 18px;
		font-family: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.view button.active {
		background: var(--ink);
		color: var(--bg);
		border-color: transparent;
	}
	.cat {
		margin-top: 26px;
	}
	.cat h2 {
		font-size: 1.25rem;
		margin: 0 0 14px;
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
