<script lang="ts">
	import { SITE } from '$lib/site';
	import { breadcrumbJsonLd, ldJson } from '$lib/seo';
	import { decodeSlipQr } from '$lib/support';

	export let data;
	const base = SITE.base;

	let selected = data.options[Math.min(2, data.options.length - 1)]; // default 200.88

	// --- slip upload (client-side only) ---
	// Reads the QR off an uploaded slip image with jsQR, decodes it with promptparse,
	// records the transRef in localStorage to thank the donor and avoid duplicate
	// uploads. This does NOT verify the transfer/amount — see note in support.ts.
	type SlipState =
		| { status: 'idle' }
		| { status: 'reading' }
		| { status: 'ok'; ref: string; dup: boolean }
		| { status: 'error'; msg: string };
	let slip: SlipState = { status: 'idle' };

	async function onSlip(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		slip = { status: 'reading' };
		try {
			const [{ default: jsQR }, bitmap] = await Promise.all([
				import('jsqr'),
				createImageBitmap(file)
			]);
			const canvas = document.createElement('canvas');
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('no-canvas');
			ctx.drawImage(bitmap, 0, 0);
			const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(img.data, img.width, img.height);
			if (!code) {
				slip = { status: 'error', msg: 'อ่าน QR ในสลิปไม่ได้ ลองรูปที่ชัดขึ้น' };
				return;
			}
			const info = decodeSlipQr(code.data);
			if (!info) {
				slip = { status: 'error', msg: 'นี่ไม่ใช่สลิปโอนเงินที่อ่านได้' };
				return;
			}
			const key = 'tp_slips';
			const seen: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
			const dup = seen.includes(info.transRef);
			if (!dup) {
				seen.push(info.transRef);
				localStorage.setItem(key, JSON.stringify(seen));
			}
			slip = { status: 'ok', ref: info.transRef, dup };
		} catch {
			slip = { status: 'error', msg: 'เกิดข้อผิดพลาดในการอ่านสลิป' };
		}
	}
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

<section class="slip card">
	<h2>โอนแล้ว? แจ้งสลิปให้เรารู้ (ไม่บังคับ)</h2>
	<p class="slip-desc">
		อัปโหลดรูปสลิปโอนเงิน เราจะอ่านเลขอ้างอิงจาก QR บนสลิปไว้เป็นหลักฐาน
		(ทำงานในเครื่องคุณ ไม่ส่งรูปออกไปไหน)
	</p>
	<label class="upload">
		<input type="file" accept="image/*" on:change={onSlip} />
		<span>📤 เลือกรูปสลิป</span>
	</label>

	{#if slip.status === 'reading'}
		<p class="slip-msg">กำลังอ่านสลิป…</p>
	{:else if slip.status === 'ok'}
		<p class="slip-ok">
			{#if slip.dup}
				🧡 สลิปนี้แจ้งไว้แล้ว (อ้างอิง {slip.ref.slice(-8)}) — ขอบคุณนะ!
			{:else}
				✅ รับแจ้งสลิปแล้ว! อ้างอิง {slip.ref.slice(-8)} — ขอบคุณที่สนับสนุน 🧡
			{/if}
		</p>
	{:else if slip.status === 'error'}
		<p class="slip-err">⚠️ {slip.msg}</p>
	{/if}
</section>

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
	.slip {
		max-width: 480px;
		padding: 20px 22px;
		margin-top: 26px;
	}
	.slip h2 {
		font-size: 1.1rem;
		margin: 0 0 6px;
	}
	.slip-desc {
		color: var(--muted);
		font-size: 0.88rem;
		margin: 0 0 14px;
	}
	.upload {
		display: inline-block;
		cursor: pointer;
	}
	.upload input {
		display: none;
	}
	.upload span {
		display: inline-block;
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: 999px;
		padding: 10px 20px;
		font-weight: 700;
	}
	.slip-msg {
		color: var(--muted);
		margin: 12px 0 0;
	}
	.slip-ok {
		color: var(--green);
		font-weight: 600;
		margin: 12px 0 0;
	}
	.slip-err {
		color: var(--fire2);
		font-weight: 600;
		margin: 12px 0 0;
	}
	.thanks {
		margin: 24px 0 40px;
		color: var(--muted);
	}
</style>
