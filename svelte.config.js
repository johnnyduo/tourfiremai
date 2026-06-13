import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		prerender: {
			// dynamic /tour/[slug] entries come from deals.json; tolerate an empty
			// dataset (e.g. before the first successful refresh) without failing.
			handleUnseenRoutes: 'warn'
		}
	}
};
