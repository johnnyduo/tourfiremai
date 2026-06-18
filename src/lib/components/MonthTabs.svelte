<script lang="ts">
	export let value: number; // 1-12
	const MONTHS_TH = [
		'ม.ค.',
		'ก.พ.',
		'มี.ค.',
		'เม.ย.',
		'พ.ค.',
		'มิ.ย.',
		'ก.ค.',
		'ส.ค.',
		'ก.ย.',
		'ต.ค.',
		'พ.ย.',
		'ธ.ค.'
	];
</script>

<div class="tabs" role="tablist" aria-label="เลือกเดือนเกิด">
	{#each MONTHS_TH as label, i}
		<button
			role="tab"
			aria-selected={value === i + 1}
			class:active={value === i + 1}
			on:click={() => (value = i + 1)}>{label}</button
		>
	{/each}
</div>

<style>
	.tabs {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 4px 0 10px;
	}
	button {
		flex: 0 0 auto;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--muted);
		border-radius: 999px;
		padding: 8px 16px;
		font-family: inherit;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	button.active {
		background: var(--grad);
		color: #fff;
		border-color: transparent;
	}
</style>
