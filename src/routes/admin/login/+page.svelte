<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<main class="page auth-page">
	<a class="back" href="/">← doh</a>
	<h1>Admin</h1>
	<p class="sub">Internal metrics only — no user financial data lives here.</p>

	<form method="POST" class="card auth-form">
		<label class="label" for="email">Email</label>
		<input
			class="input"
			id="email"
			name="email"
			type="email"
			autocomplete="username"
			value={form?.email ?? ''}
			required
		/>

		<label class="label" for="password">Password</label>
		<input class="input" id="password" name="password" type="password" autocomplete="current-password" required />

		{#if form?.error}
			<p class="error-text">{form.error}</p>
		{/if}

		<button class="btn btn-primary" type="submit">Log in</button>
	</form>
</main>

<style>
	.auth-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 80px;
		gap: 6px;
		text-align: center;
	}
	.back {
		align-self: flex-start;
		margin: 0 0 32px 0;
		font-family: var(--font-display);
		font-size: 22px;
		color: var(--purple);
		text-decoration: none;
	}
	h1 {
		font-size: 30px;
	}
	.sub {
		color: var(--text-2);
		font-size: 13px;
		margin-bottom: 24px;
		max-width: 300px;
	}
	.auth-form {
		width: 100%;
		max-width: 340px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		text-align: left;
	}
	.input {
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		padding: 12px 14px;
		color: var(--text-1);
		font-size: 15px;
		margin-bottom: 12px;
		outline: none;
		font-family: var(--font-body);
	}
	.input:focus {
		border-color: var(--purple);
	}
</style>
