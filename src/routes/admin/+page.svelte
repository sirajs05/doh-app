<script lang="ts">
	import { MOODS } from '$lib/moods';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function moodMeta(value: string) {
		return MOODS.find((m) => m.value === value) ?? MOODS[2];
	}

	let maxCount = $derived(Math.max(1, ...data.moodCounts.map((m) => m.total)));
</script>

<header class="topbar">
	<span class="wm">doh <span class="admin-tag">admin</span></span>
	<div class="topbar-right">
		<span class="who">{data.email}</span>
		<form method="POST" action="/logout">
			<button class="btn btn-ghost small" type="submit">Log out</button>
		</form>
	</div>
</header>

<main class="page admin-page">
	<div class="stat-row">
		<div class="card stat-box">
			<p class="label">Total users</p>
			<p class="stat-value">{data.totalUsers}</p>
		</div>
		<div class="card stat-box">
			<p class="label">Total check-ins</p>
			<p class="stat-value">{data.totalCheckIns}</p>
		</div>
	</div>

	<section class="section">
		<p class="label section-label">Mood distribution</p>
		<div class="card">
			{#each data.moodCounts as m (m.mood)}
				{@const meta = moodMeta(m.mood)}
				<div class="mood-row">
					<span class="mood-row-label">{meta.emoji} {meta.label}</span>
					<div class="mood-bar-wrap">
						<div class="mood-bar-fill" style="width:{(m.total / maxCount) * 100}%; background:{meta.color}"
						></div>
					</div>
					<span class="mood-row-count">{m.total}</span>
				</div>
			{/each}
		</div>
	</section>

	<section class="section">
		<p class="label section-label">Recent check-ins</p>
		<div class="card">
			{#each data.recentCheckIns as c, i (i)}
				{@const meta = moodMeta(c.mood)}
				<div class="checkin-row">
					<span class="checkin-email">{c.email}</span>
					<span class="checkin-mood">{meta.emoji} {meta.label}</span>
					<span class="checkin-when">{new Date(c.createdAt).toLocaleString()}</span>
				</div>
			{/each}
		</div>
	</section>
</main>

<style>
	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
	}
	.wm {
		font-family: var(--font-display);
		font-size: 22px;
		color: var(--purple);
	}
	.admin-tag {
		font-family: var(--font-body);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-3);
		vertical-align: middle;
		margin-left: 6px;
	}
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.who {
		font-size: 12px;
		color: var(--text-3);
	}
	.small {
		padding: 8px 14px;
		font-size: 12px;
	}
	.admin-page {
		display: flex;
		flex-direction: column;
		gap: 26px;
		max-width: 640px;
	}
	.stat-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.stat-box {
		text-align: center;
	}
	.stat-value {
		font-family: var(--font-display);
		font-size: 32px;
		color: var(--gold);
		margin-top: 4px;
	}
	.section-label {
		margin-bottom: 10px;
	}
	.mood-row {
		display: grid;
		grid-template-columns: 130px 1fr 30px;
		align-items: center;
		gap: 10px;
		padding: 8px 0;
	}
	.mood-row-label {
		font-size: 12px;
		color: var(--text-2);
	}
	.mood-bar-wrap {
		height: 8px;
		background: var(--surface-3);
		border-radius: 4px;
		overflow: hidden;
	}
	.mood-bar-fill {
		height: 100%;
		border-radius: 4px;
	}
	.mood-row-count {
		font-size: 12px;
		color: var(--text-1);
		text-align: right;
	}
	.checkin-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 12px;
		padding: 9px 0;
		border-bottom: 1px solid var(--border);
		font-size: 12px;
		align-items: center;
	}
	.checkin-row:last-child {
		border-bottom: none;
	}
	.checkin-email {
		color: var(--text-1);
	}
	.checkin-mood {
		color: var(--text-2);
	}
	.checkin-when {
		color: var(--text-3);
	}
</style>
