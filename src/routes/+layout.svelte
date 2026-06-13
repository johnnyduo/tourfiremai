<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { organizationJsonLd, webSiteJsonLd, ldJson } from '$lib/seo';
	const base = 'https://tourfiremai.com';
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${ldJson(organizationJsonLd(base))}<\/script>`}
	{@html `<script type="application/ld+json">${ldJson(webSiteJsonLd(base))}<\/script>`}
</svelte:head>

<Header />
<main class="container">
	<slot />
</main>
<Footer />
