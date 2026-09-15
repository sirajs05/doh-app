<main class="hero">
	<div class="wordmark" aria-label="doh">
		<span class="wm-shadow">doh</span>
		<span class="wm-main">doh</span>
	</div>
	<p class="tagline">A calmer way to look at your money.</p>
	<div class="cta-row">
		<a class="btn btn-primary" href="/login">Enter</a>
	</div>
	<a class="admin-link" href="/admin/login">Admin</a>
</main>

<style>
	.hero {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 22px;
		padding: 24px;
	}
	.wordmark {
		position: relative;
		display: inline-block;
	}
	.wm-shadow,
	.wm-main {
		font-family: var(--font-display);
		font-size: clamp(64px, 16vw, 120px);
		line-height: 1;
		letter-spacing: 0.04em;
	}
	.wm-shadow {
		position: absolute;
		inset: 0;
		color: var(--blue);
		transform: translate(6px, 6px);
	}
	.wm-main {
		position: relative;
		color: var(--purple);
	}
	.tagline {
		font-size: 15px;
		color: var(--text-2);
		max-width: 320px;
	}
	.cta-row {
		margin-top: 8px;
	}
	.admin-link {
		position: fixed;
		bottom: 20px;
		right: 24px;
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-3);
		text-decoration: none;
	}
</style>
