<script lang="ts">
	import type { CardPromo } from '$lib/card/types';
	import { daysLeft } from '$lib/card/select';
	export let promo: CardPromo;
	export let now: Date;

	$: left = daysLeft(promo, now);
	$: ending = left !== null && left <= 30; // highlight deals ending within a month
</script>

<article class="card cardpromo">
	<div class="top">
		<span class="bank">{promo.bank}</span>
		{#if promo.merchant}<span class="merchant">{promo.merchant}</span>{/if}
	</div>
	<p class="perk">{promo.perk}</p>
	{#if promo.cardName}<p class="cardname">{promo.cardName}</p>{/if}
	{#if promo.condition}<p class="cond">เงื่อนไข: {promo.condition}</p>{/if}
	{#if promo.note}<p class="note">{promo.note}</p>{/if}
	<div class="foot">
		{#if left !== null}
			<span class="left" class:ending>⏳ เหลือ {left} วัน</span>
		{:else if promo.evergreen}
			<span class="ever">สิทธิ์ประจำบัตร</span>
		{/if}
		{#if promo.url}<a class="link" href={promo.url} target="_blank" rel="nofollow noopener"
				>ดูรายละเอียด</a
			>{/if}
	</div>
</article>

<style>
	.cardpromo {
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.top {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.bank {
		font-weight: 800;
		font-size: 1rem;
	}
	.merchant {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 2px 9px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--fire2) 13%, transparent);
		color: var(--fire2);
	}
	.perk {
		margin: 2px 0 0;
		font-weight: 600;
	}
	.cardname,
	.cond,
	.note {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 4px;
	}
	.left,
	.ever {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--muted);
	}
	.left.ending {
		color: var(--red);
	}
	.link {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--fire2);
		text-decoration: none;
	}
</style>
