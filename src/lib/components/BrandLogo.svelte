<script lang="ts">
	import { brandLogo, productImage, letterMark } from '$lib/birthday/logo';

	export let brand: string;
	export let domain: string | undefined = undefined;
	/** verified, stable product/brand photo (proxied + cover-cropped); preferred over the logo */
	export let image: string | undefined = undefined;
	export let size = 48;

	// Ordered candidate image sources. On load error we advance to the next; when all
	// are exhausted we render the letter-mark. `kind` controls fit (cover for photos,
	// contain for logos so they aren't cropped).
	$: candidates = [
		image ? { src: productImage(image, size * 2), kind: 'photo' as const } : null,
		domain ? { src: brandLogo(domain, size * 2), kind: 'logo' as const } : null
	].filter((c): c is { src: string; kind: 'photo' | 'logo' } => !!c && !!c.src);

	let idx = 0;
	// reset when the brand changes (candidates list is keyed on it)
	$: brand, image, domain, (idx = 0);
	$: current = candidates[idx];
	$: mark = letterMark(brand);
	$: showMark = !current;
</script>

<span
	class="logo"
	style={`width:${size}px;height:${size}px;${showMark ? `background:${mark.color};` : ''}`}
	aria-hidden="true"
>
	{#if showMark}
		<span class="mark" style={`font-size:${Math.round(size * 0.42)}px`}>{mark.initial}</span>
	{:else}
		{#key idx}
			<img
				src={current.src}
				class={current.kind}
				alt={`${brand}`}
				width={size}
				height={size}
				loading="lazy"
				decoding="async"
				on:error={() => (idx += 1)}
			/>
		{/key}
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
		display: block;
	}
	/* product photos fill the square; logos sit contained with padding */
	.logo img.photo {
		object-fit: cover;
	}
	.logo img.logo {
		object-fit: contain;
		padding: 6px;
	}
	.mark {
		color: #fff;
		font-weight: 800;
		line-height: 1;
	}
</style>
