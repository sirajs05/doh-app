<script lang="ts">
	let { email, active }: { email: string; active: 'vibes' | 'health' } = $props();
</script>

<header class="nav">
	<a class="wm" href="/vibes">doh</a>
	<nav class="nav-links">
		<a href="/vibes" class="nav-link" class:active={active === 'vibes'}>Vibes</a>
		<a href="/health" class="nav-link" class:active={active === 'health'}>Health</a>
	</nav>
	<div class="nav-right">
		<span class="who">{email}</span>
		<form method="POST" action="/logout">
			<button class="btn btn-ghost small" type="submit">Log out</button>
		</form>
	</div>
</header>

<style>
	.nav {
		display: flex;
		align-items: center;
		gap: 28px;
		padding: 18px 24px;
		border-bottom: 1px solid var(--border);
		flex-wrap: wrap;
	}
	.wm {
		font-family: var(--font-display);
		font-size: 22px;
		color: var(--purple);
		text-decoration: none;
		flex-shrink: 0;
	}
	.nav-links {
		display: flex;
		gap: 4px;
		flex: 1;
	}
	.nav-link {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.03em;
		color: var(--text-3);
		text-decoration: none;
		padding: 7px 14px;
		border-radius: var(--radius-sm);
		transition: all 0.15s;
	}
	.nav-link:hover {
		color: var(--text-1);
	}
	.nav-link.active {
		color: var(--text-1);
		background: var(--surface-1);
	}
	.nav-right {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}
	.who {
		font-size: 12px;
		color: var(--text-3);
	}
	.small {
		padding: 8px 14px;
		font-size: 12px;
	}
</style>
