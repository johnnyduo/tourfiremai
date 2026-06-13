<script lang="ts">
	import type { Tour } from '$lib/types';
	import { proxyImage, CARD_RATIO } from '$lib/images';
	import { SOURCE_LABELS } from '$lib/sources-meta';
	import FireBadge from './FireBadge.svelte';
	import PriceTag from './PriceTag.svelte';
	import CountryChip from './CountryChip.svelte';
	export let t: Tour;
	/** eager-load the first row (above the fold) for fast LCP, lazy-load the rest */
	export let eager = false;

	$: lowSeat = t.periods.find((p) => p.seats != null && p.seats > 0 && p.seats <= 5);
	$: reason = [
		t.nextDepartISO ? `ออกเดินทาง ${new Date(t.nextDepartISO).toLocaleDateString('th-TH')}` : '',
		lowSeat ? `เหลือ ${lowSeat.seats} ที่` : ''
	]
		.filter(Boolean)
		.join(' · ');
</script>

<a class="card" href={`/tour/${t.slug}`}>
	<div class="img">
		<img
			src={proxyImage(t.image, 480, CARD_RATIO)}
			srcset={`${proxyImage(t.image, 480, CARD_RATIO)} 480w, ${proxyImage(t.image, 768, CARD_RATIO)} 768w`}
			sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
			alt={t.title}
			width="360"
			height="225"
			loading={eager ? 'eager' : 'lazy'}
			fetchpriority={eager ? 'high' : 'auto'}
			decoding="async"
		/>
		<div class="fb"><FireBadge score={t.fireScore} {reason} /></div>
	</div>
	<div class="body">
		<CountryChip country={t.country} />
		<h3>{t.title}</h3>
		<div class="meta">
			{#if t.days}{t.days} วัน{#if t.nights} {t.nights} คืน{/if}{/if}
			{#if t.airline} · {t.airline}{/if}
		</div>
		<PriceTag price={t.priceFrom} before={t.periods[0]?.priceBefore} discount={t.discountPct} />
		{#if reason}<div class="reason">{reason}</div>{/if}
		<div class="src">โดย {SOURCE_LABELS[t.source] ?? t.source}</div>
	</div>
</a>

<style>
	.card {
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.img {
		position: relative;
		aspect-ratio: 16 / 10;
		background: var(--line);
	}
	.img img {
		width: 100%;
		height: 100%;
		/* wsrv already crops to the card ratio (a=top); object-fit guards rounding */
		object-fit: cover;
		object-position: top center;
		display: block;
	}
	.fb {
		position: absolute;
		top: 10px;
		left: 10px;
	}
	.body {
		padding: 14px 16px;
		display: grid;
		gap: 8px;
	}
	h3 {
		margin: 0;
		font-size: 1rem;
		line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meta {
		color: var(--muted);
		font-size: 0.85rem;
	}
	.reason {
		color: var(--red);
		font-size: 0.8rem;
		font-weight: 600;
	}
	.src {
		color: var(--muted);
		font-size: 0.75rem;
	}
</style>
