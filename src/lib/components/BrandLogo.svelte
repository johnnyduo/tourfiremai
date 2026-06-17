<script lang="ts">
	import { brandLogo, letterMark } from '$lib/birthday/logo';

	export let brand: string;
	export let domain: string | undefined = undefined;
	export let size = 48;

	$: src = brandLogo(domain, size * 2); // 2x for crisp rendering on retina
	$: mark = letterMark(brand);
	// show the letter-mark when there's no logo URL or the image failed to load
	let failed = false;
	$: showMark = !src || failed;
</script>

<span
	class="logo"
	style={`width:${size}px;height:${size}px;${showMark ? `background:${mark.color};` : ''}`}
	aria-hidden="true"
>
	{#if showMark}
		<span class="mark" style={`font-size:${Math.round(size * 0.42)}px`}>{mark.initial}</span>
	{:else}
		<img
			{src}
			alt={`${brand} logo`}
			width={size}
			height={size}
			loading="lazy"
			decoding="async"
			on:error={() => (failed = true)}
		/>
	{/if}
</span>

<style>
	.logo {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		overflow: hidden;
		background: var(--card);
		border: 1px solid var(--line);
	}
	.logo img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		padding: 6px;
	}
	.mark {
		color: #fff;
		font-weight: 800;
		line-height: 1;
	}
</style>
