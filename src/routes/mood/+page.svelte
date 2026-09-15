<script lang="ts">
	import { MOODS } from '$lib/moods';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	let selected = $state<string | null>(null);
</script>

<main class="page mood-page">
	<p class="label">Before we begin</p>
	<h1>How are you feeling about your finances today?</h1>

	<form method="POST" class="mood-form">
		<div class="mood-grid">
			{#each MOODS as m (m.value)}
				<button
					type="button"
					class="mood-btn"
					class:sel={selected === m.value}
					style="--accent:{m.color}"
					onclick={() => (selected = m.value)}
				>
					<span class="emoji">{m.emoji}</span>
					<span class="mood-label">{m.label}</span>
				</button>
			{/each}
		</div>
		<input type="hidden" name="mood" value={selected ?? ''} />

		{#if form?.error}
			<p class="error-text">{form.error}</p>
		{/if}

		<button class="btn btn-primary continue-btn" type="submit" disabled={!selected}>Continue</button>
	</form>
</main>

<style>
	.mood-page {
		padding-top: 64px;
		text-align: center;
	}
	h1 {
		font-size: 28px;
		max-width: 440px;
		margin: 10px auto 32px;
		line-height: 1.3;
	}
	.mood-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
		gap: 12px;
		margin-bottom: 26px;
	}
	.mood-btn {
		background: var(--surface-1);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 20px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.mood-btn .emoji {
		font-size: 28px;
	}
	.mood-btn .mood-label {
		font-size: 12px;
		color: var(--text-2);
	}
	.mood-btn.sel {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 16%, var(--surface-1));
	}
	.mood-btn.sel .mood-label {
		color: var(--text-1);
	}
	.continue-btn {
		width: 100%;
		max-width: 300px;
	}
	.continue-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
