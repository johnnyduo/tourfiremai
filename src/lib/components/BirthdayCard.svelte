<script lang="ts">
	import type { BirthdayPromo } from '$lib/birthday/types';
	import { CHANNEL_LABELS } from '$lib/birthday/types';
	import BrandLogo from './BrandLogo.svelte';
	export let promo: BirthdayPromo;
	$: channelText = promo.channelLabel ?? CHANNEL_LABELS[promo.channel];
</script>

<article class="card bday">
	<div class="top">
		<BrandLogo brand={promo.brand} domain={promo.domain} size={44} />
		<h3>{promo.brand}</h3>
		<span class="chip">{channelText}</span>
	</div>
	<p class="perk">{promo.perk}</p>
	{#if promo.condition}<p class="cond">เงื่อนไข: {promo.condition}</p>{/if}
	{#if promo.note}<p class="note">{promo.note}</p>{/if}
	{#if promo.url}<a class="link" href={promo.url} target="_blank" rel="nofollow noopener"
			>ดูรายละเอียด</a
		>{/if}
</article>

<style>
	.bday {
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.top {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	h3 {
		margin: 0;
		font-size: 1.05rem;
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chip {
		flex: 0 0 auto;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 3px 10px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--fire2) 14%, transparent);
		color: var(--fire2);
	}
	.perk {
		margin: 2px 0 0;
		font-weight: 600;
	}
	.cond,
	.note {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.link {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--fire2);
		text-decoration: none;
		margin-top: 2px;
	}
</style>
