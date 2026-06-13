<script lang="ts">
	import { COUNTRY_LABELS } from '$lib/countries';
	export let country: string;
</script>

<span class="chip">{COUNTRY_LABELS[country] ?? country}</span>

<style>
	.chip {
		background: rgba(255, 90, 60, 0.1);
		color: var(--fire2);
		border-radius: 999px;
		padding: 3px 10px;
		font-size: 0.78rem;
		font-weight: 700;
		display: inline-block;
	}
</style>
