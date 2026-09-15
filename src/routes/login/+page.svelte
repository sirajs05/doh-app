<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<main class="page auth-page">
	<a class="back" href="/">← doh</a>
	<h1>Welcome back</h1>
	<p class="sub">Log in to check in on your finances.</p>

	<form method="POST" class="card auth-form">
		<label class="label" for="email">Email</label>
		<input
			class="input"
			id="email"
			name="email"
			type="email"
			autocomplete="email"
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

	<section class="card demo-creds">
		<p class="label">Demo login</p>
		<p class="cred-line"><span class="cred-key">Email</span><code class="cred">test@test.com</code></p>
		<p class="cred-line"><span class="cred-key">Password</span><code class="cred">password123</code></p>
		<p class="cred-foot">
			Or log in as Admin — <a href="/admin/login">Admin login</a>
		</p>
		<p class="cred-line"><span class="cred-key">Email</span><code class="cred">admin@doh.app</code></p>
		<p class="cred-line"><span class="cred-key">Password</span><code class="cred">Admin123!</code></p>
	</section>
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
		font-size: 14px;
		margin-bottom: 24px;
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
	.btn {
		margin-top: 6px;
	}
	.demo-creds {
		width: 100%;
		max-width: 340px;
		margin-top: 22px;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 10px;
		border-color: var(--border-strong);
	}
	.cred-line {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}
	.cred-key {
		font-size: 12px;
		color: var(--text-2);
	}
	.cred {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 20px;
		font-weight: 600;
		color: #ffffff;
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		padding: 6px 10px;
		user-select: all;
	}
	.cred-foot {
		font-family: var(--font-display);
		font-size: 18px;
		color: #ffffff;
		margin-top: 6px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
	}
	.cred-foot a {
		color: var(--purple);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
