<script lang="ts">
	import { SITE } from '$lib/site';
	import { breadcrumbJsonLd, ldJson } from '$lib/seo';

	export let data;
	const base = SITE.base;

	let selected = data.options[Math.min(2, data.options.length - 1)]; // default 200.88
</script>

<svelte:head>
	<title>สนับสนุนเรา — ช่วยค่าเซิร์ฟเวอร์ TionPromo 💝 | {SITE.name}</title>
	<meta
		name="description"
		content="TionPromo รวมโปรโมชันฟรีไม่มีโฆษณากวนใจ ถ้าชอบเว็บนี้ ร่วมสนับสนุนค่าเซิร์ฟเวอร์ผ่าน PromptPay ได้เลย 💝"
	/>
	<link rel="canonical" href={`${base}/support`} />
	<meta property="og:title" content={`สนับสนุน ${SITE.name} 💝`} />
	<meta property="og:description" content="ช่วยค่าเซิร์ฟเวอร์ผ่าน PromptPay" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${base}/support`} />
	{@html `<script type="application/ld+json">${ldJson(
		breadcrumbJsonLd([
			{ name: SITE.name, url: base },
			{ name: 'สนับสนุนเรา', url: `${base}/support` }
		])
	)}<\/script>`}
</svelte:head>

<section class="hero">
	<h1>💝 สนับสนุน <span class="fire-text">{SITE.name}</span></h1>
	<p>
		เว็บนี้รวมโปรโมชันให้ฟรี ไม่มีโฆษณากวนใจ — ถ้าชอบและอยากให้เราไปต่อ
		ร่วมสมทบค่าเซิร์ฟเวอร์ผ่าน PromptPay ได้เลย ทุกบาทมีความหมาย 🙏
	</p>
</section>

{#if !data.configured}
	<p class="warn">⚠️ ยังไม่ได้ตั้งค่าเลขพร้อมเพย์ — QR ด้านล่างเป็นตัวอย่าง</p>
{/if}

<div class="amounts" role="group" aria-label="เลือกจำนวนเงินสนับสนุน">
	{#each data.options as opt (opt.amount)}
		<button class:active={selected === opt} on:click={() => (selected = opt)}>
			฿{opt.label}
		</button>
	{/each}
</div>

<div class="qr card">
	<img src={selected.qr} alt={`PromptPay QR ${selected.amount} บาท`} width="280" height="280" />
	<p class="amt">฿{selected.amount.toFixed(2)}</p>
	<p class="note">
		สแกนด้วยแอปธนาคารเพื่อโอน · ยอดลงท้าย <strong>.{String(data.satang).split('.')[1]}</strong>
		เพื่อให้เรารู้ว่ามาจากเว็บนี้
	</p>
</div>

<p class="thanks">ขอบคุณที่สนับสนุน TionPromo 🧡 — เรานำไปพัฒนาเว็บและจ่ายค่าเซิร์ฟเวอร์</p>

<style>
	.hero {
		padding: 40px 0 16px;
	}
	.hero h1 {
		font-size: clamp(1.6rem, 4.5vw, 2.6rem);
		margin: 0 0 8px;
	}
	.hero p {
		color: var(--muted);
		max-width: 600px;
	}
	.warn {
		color: var(--fire2);
		font-weight: 600;
	}
	.amounts {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 18px 0;
	}
	.amounts button {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink);
		border-radius: 999px;
		padding: 10px 22px;
		font-family: inherit;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
	}
	.amounts button.active {
		background: var(--grad);
		color: #fff;
		border-color: transparent;
	}
	.qr {
		max-width: 360px;
		padding: 22px;
		text-align: center;
	}
	.qr img {
		width: 280px;
		height: 280px;
		max-width: 100%;
		border-radius: 12px;
	}
	.amt {
		font-size: 1.5rem;
		font-weight: 800;
		margin: 12px 0 4px;
	}
	.note {
		color: var(--muted);
		font-size: 0.88rem;
		margin: 0;
	}
	.thanks {
		margin: 24px 0 40px;
		color: var(--muted);
	}
</style>
