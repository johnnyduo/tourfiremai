<script lang="ts">
	export let score: number;
	export let reason = '';
	$: tier = score >= 75 ? 'ร้อนแรง' : score >= 50 ? 'น่าสนใจ' : 'ดีล';
</script>

<span class="badge" title={reason}>🔥 {tier} · {Math.round(score)}</span>

<style>
	.badge {
		background: var(--grad);
		color: #fff;
		font-weight: 800;
		font-size: 0.8rem;
		padding: 5px 12px;
		border-radius: 999px;
		display: inline-flex;
		gap: 4px;
		white-space: nowrap;
		box-shadow: 0 4px 12px rgba(255, 90, 60, 0.35);
	}
</style>
