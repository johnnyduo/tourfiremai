<script lang="ts">
	export let price: number;
	export let before: number | undefined = undefined;
	export let discount: number | undefined = undefined;
</script>

<div class="price">
	<strong>฿{price.toLocaleString('th-TH')}</strong>
	{#if before}<s>฿{before.toLocaleString('th-TH')}</s>{/if}
	{#if discount}<em>-{discount}%</em>{/if}
</div>

<style>
	.price {
		display: flex;
		align-items: baseline;
		gap: 8px;
		flex-wrap: wrap;
	}
	.price strong {
		font-size: 1.3rem;
		color: var(--fire2);
	}
	.price s {
		color: var(--muted);
		font-size: 0.85rem;
	}
	.price em {
		color: var(--green);
		font-weight: 700;
		font-style: normal;
		font-size: 0.85rem;
	}
</style>
