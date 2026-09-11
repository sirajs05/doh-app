<script lang="ts">
	import { onMount } from 'svelte';

	let dbStatus = $state('checking...');

	onMount(async () => {
		try {
			const res = await fetch('/api/health');
			const data = await res.json();
			dbStatus = data.ok ? 'connected to Neon' : `not connected (${data.error ?? 'unknown error'})`;
		} catch (err) {
			dbStatus = `could not reach /api/health (${err})`;
		}
	});
</script>

<h1>Doh-App</h1>
<p>SvelteKit + TypeScript + Drizzle + Neon starter.</p>
<p>Database status: {dbStatus}</p>
