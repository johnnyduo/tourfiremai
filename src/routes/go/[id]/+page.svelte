<script lang="ts">
	import { onMount } from 'svelte';
	export let data;
	onMount(() => {
		window.location.replace(data.url);
	});
</script>

<svelte:head>
	<title>กำลังพาไปจองทัวร์… | TourFireMai</title>
	<meta name="robots" content="noindex,nofollow" />
	<meta http-equiv="refresh" content={`0;url=${data.url}`} />
</svelte:head>

<div class="go">
	<p>🔥 กำลังพาคุณไปยังหน้าจองทัวร์…</p>
	<p class="sm">หากไม่เปลี่ยนหน้าอัตโนมัติ <a href={data.url} rel="nofollow noopener">คลิกที่นี่</a></p>
</div>

<style>
	.go {
		text-align: center;
		padding: 80px 20px;
	}
	.sm {
		color: var(--muted);
		font-size: 0.9rem;
	}
</style>
