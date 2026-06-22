<script lang="ts">
	import { onMount } from 'svelte';
	import CardPromoCard from '$lib/components/CardPromoCard.svelte';
	import { activePromos, groupByCategory } from '$lib/card/select';
	import { SITE } from '$lib/site';
	import { faqJsonLd, breadcrumbJsonLd, ldJson } from '$lib/seo';

	export let data;
	const base = SITE.base;

	// Expiry is evaluated against the real current date so promos that lapse after the
	// build silently drop out without a redeploy. SSR uses the build date; the client
	// re-evaluates on mount.
	let now = new Date(data.generatedAt);
	onMount(() => {
		now = new Date();
	});

	$: active = activePromos(data.promos, now);
	$: groups = groupByCategory(active);
	$: total = active.length;

	const faqs = [
		{
			q: 'โปรบัตรเครดิตนี้ใช้ได้กับบัตรอะไร?',
			a: 'แต่ละโปรระบุธนาคารและเงื่อนไขบัตรไว้บนการ์ด บางโปรเฉพาะบัตรบางใบหรือต้องลงทะเบียนก่อน โปรดตรวจสอบรายละเอียดกับธนาคารผู้ออกบัตรอีกครั้งก่อนใช้สิทธิ์'
		},
		{
			q: 'ข้อมูลโปรอัปเดตบ่อยแค่ไหน?',
			a: 'เรารวบรวมและคัดสรรโปรบัตรเครดิตที่ยังใช้ได้ โปรที่หมดเขตจะถูกซ่อนอัตโนมัติ แต่เงื่อนไขอาจเปลี่ยนแปลง โปรดยืนยันกับธนาคารก่อนใช้สิทธิ์ทุกครั้ง'
		}
	];
</script>

<svelte:head>
	<title>โปรบัตรเครดิต 2026 — รวมดีลตามหมวดใช้จ่าย ร้านอาหาร ปั๊ม ช้อปปิ้ง | {SITE.name}</title>
	<meta
		name="description"
		content="รวมโปรบัตรเครดิตไทยที่ใช้ได้จริง จัดตามหมวดใช้จ่าย — ร้านอาหาร ปั๊มน้ำมัน ช้อปปิ้ง ท่องเที่ยว เครดิตเงินคืน ผ่อน 0% แลกคะแนน อัปเดตล่าสุด 💳"
	/>
	<link rel="canonical" href={`${base}/card`} />
	<meta property="og:title" content={`โปรบัตรเครดิต — รวมดีลตามหมวดใช้จ่าย | ${SITE.name}`} />
	<meta property="og:description" content="เลือกตามที่คุณใช้จ่าย ดูโปรบัตรที่คุ้มที่สุด 💳" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="th_TH" />
	<meta property="og:url" content={`${base}/card`} />
	{@html `<script type="application/ld+json">${ldJson(faqJsonLd(faqs))}<\/script>`}
	{@html `<script type="application/ld+json">${ldJson(
		breadcrumbJsonLd([
			{ name: SITE.name, url: base },
			{ name: 'โปรบัตรเครดิต', url: `${base}/card` }
		])
	)}<\/script>`}
</svelte:head>

<section class="hero">
	<h1>💳 <span class="fire-text">โปรบัตรเครดิต</span> — เลือกตามที่คุณใช้จ่าย</h1>
	<p>
		รวม {total} โปรบัตรเครดิตที่ใช้ได้จริง จัดตามหมวดใช้จ่าย — กิน เติมน้ำมัน ช้อป เที่ยว ·
		อัปเดต {data.generatedAt} · โปรดยืนยันกับธนาคาร
	</p>
</section>

{#if groups.length}
	{#each groups as g (g.category)}
		<section class="cat">
			<h2>{g.icon} {g.label} <span class="count">{g.items.length}</span></h2>
			<div class="grid">
				{#each g.items as promo (promo.id)}
					<CardPromoCard {promo} {now} />
				{/each}
			</div>
		</section>
	{/each}
{:else}
	<p class="empty">กำลังรวบรวมโปรบัตรเครดิต โปรดกลับมาใหม่อีกครั้ง 💳</p>
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
	.cat {
		margin-top: 26px;
	}
	.cat h2 {
		font-size: 1.25rem;
		margin: 0 0 14px;
		display: flex;
		align-items: baseline;
		gap: 8px;
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
