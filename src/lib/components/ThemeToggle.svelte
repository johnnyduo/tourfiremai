<script lang="ts">
	import { onMount } from 'svelte';
	let theme: 'light' | 'dark' = 'light';

	onMount(() => {
		const saved = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
		theme = saved;
		apply(saved);
	});

	function apply(t: 'light' | 'dark') {
		document.documentElement.setAttribute('data-theme', t);
		const meta = document.querySelector('meta[name="theme-color"]:not([media])');
		if (meta) meta.setAttribute('content', t === 'dark' ? '#14110e' : '#fffdf9');
	}

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		try {
			localStorage.setItem('theme', theme);
		} catch (e) {
			/* ignore */
		}
		apply(theme);
	}
</script>

<button
	class="toggle"
	on:click={toggle}
	aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
	title="สลับโหมดสว่าง/มืด"
>
	{theme === 'dark' ? '☀️' : '🌙'}
</button>

<style>
	.toggle {
		background: transparent;
		border: 1px solid var(--line);
		border-radius: 999px;
		width: 38px;
		height: 38px;
		font-size: 1rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		flex-shrink: 0;
	}
	.toggle:hover {
		border-color: var(--fire2);
	}
</style>
