<script lang="ts">
	import { COUNTRY_LABELS } from '$lib/countries';
	const navCountries = ['china', 'japan', 'korea', 'vietnam', 'taiwan', 'hongkong'];
</script>

<header>
	<div class="container bar">
		<a class="brand" href="/">TourFireMai <span>🔥</span></a>
		<nav>
			{#each navCountries as c}
				<a href={`/destination/${c}`}>{COUNTRY_LABELS[c]}</a>
			{/each}
			<a href="/search" class="search-link">ค้นหา</a>
		</nav>
	</div>
</header>

<style>
	header {
		border-bottom: 1px solid var(--line);
		position: sticky;
		top: 0;
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(10px);
		z-index: 10;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 62px;
		gap: 16px;
	}
	.brand {
		font-weight: 800;
		font-size: 1.25rem;
		text-decoration: none;
	}
	.brand span {
		-webkit-text-fill-color: initial;
	}
	nav {
		display: flex;
		gap: 16px;
		align-items: center;
		overflow-x: auto;
	}
	nav a {
		text-decoration: none;
		color: var(--muted);
		font-weight: 600;
		font-size: 0.92rem;
		white-space: nowrap;
	}
	nav a:hover {
		color: var(--fire2);
	}
	.search-link {
		color: var(--fire2);
	}
</style>
