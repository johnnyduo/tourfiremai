<script lang="ts">
	import type { Tour } from '$lib/types';
	import TourCard from './TourCard.svelte';

	export let deals: Tour[];
	export let step = 24;

	let shown = step;
	// reset when the underlying list changes (e.g. search filters)
	$: deals, (shown = step);
	$: visible = deals.slice(0, shown);
	$: remaining = deals.length - shown;
</script>

{#if visible.length}
	<div class="grid">
		{#each visible as t, i (t.id)}
			<TourCard {t} eager={i < 6} />
		{/each}
	</div>
	{#if remaining > 0}
		<div class="more">
			<button class="btn-fire" on:click={() => (shown += step)}>
				ดูเพิ่มอีก {Math.min(step, remaining)} ดีล (เหลือ {remaining})
			</button>
		</div>
	{/if}
{:else}
	<slot name="empty"><p class="empty">ไม่พบดีลทัวร์</p></slot>
{/if}

<style>
	.more {
		display: flex;
		justify-content: center;
		margin: 34px 0 8px;
	}
	.empty {
		padding: 60px 0;
		text-align: center;
		color: var(--muted);
	}
</style>
