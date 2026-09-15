<script lang="ts">
	import NavBar from '$lib/components/NavBar.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

	const chartW = 340;
	const chartH = 150;
	const baseline = 118;
	const barW = 28;
	let gap = $derived((chartW - data.dailySpend.length * barW) / (data.dailySpend.length + 1));
	let maxAmount = $derived(Math.max(1, ...data.dailySpend.map((d) => d.amount)));
	let linePoints = $derived(
		data.dailySpend.map((d, i) => {
			const x = gap + i * (barW + gap) + barW / 2;
			const h = Math.max(2, (d.amount / maxAmount) * 96);
			return { x, y: baseline - h };
		})
	);
	let polylinePoints = $derived(linePoints.map((p) => `${p.x},${p.y}`).join(' '));
</script>

<NavBar email={data.email} active="vibes" />

<main class="page vibes-page">
	<section class="card hero-card">
		<p class="label">Net worth</p>
		<p class="hero-value">{fmt(data.netWorth)}</p>
		<p class="hero-note">
			Placeholder data for the test account — nothing here is pulled from a real bank yet.
		</p>
	</section>

	<section class="section">
		<p class="label section-label">Accounts</p>
		<div class="card-list">
			{#each data.accounts as a (a.id)}
				<div class="card row-card">
					<div>
						<p class="row-title">{a.name}</p>
						<p class="row-sub">{a.type}</p>
					</div>
					<p class="row-value" class:negative={a.balance < 0}>{fmt(a.balance)}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="section">
		<p class="label section-label">Daily spending this week</p>
		<div class="card chart-card">
			<svg viewBox="0 0 {chartW} {chartH}" class="bar-chart">
				<line x1="0" y1={baseline} x2={chartW} y2={baseline} stroke="var(--border-strong)" stroke-width="1" />
				{#each data.dailySpend as d, i (i)}
					{@const x = gap + i * (barW + gap)}
					{@const h = Math.max(2, (d.amount / maxAmount) * 96)}
					<rect
						x={x}
						y={baseline - h}
						width={barW}
						height={h}
						rx="5"
						fill={d.amount === maxAmount ? 'var(--gold)' : 'var(--purple)'}
						opacity={d.amount === 0 ? 0.25 : 0.9}
					/>
					<text
						x={x + barW / 2}
						y={baseline + 16}
						text-anchor="middle"
						font-family="Jorick"
						font-size="10"
						fill="var(--text-3)">{d.label}</text
					>
					<text
						x={x + barW / 2}
						y={baseline - h - 6}
						text-anchor="middle"
						font-family="Jorick"
						font-size="9"
						fill="var(--text-2)">{d.amount > 0 ? fmt(d.amount).replace('.00', '') : ''}</text
					>
				{/each}
				<polyline
					points={polylinePoints}
					fill="none"
					stroke="var(--blue)"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
				{#each linePoints as p, i (i)}
					<circle cx={p.x} cy={p.y} r="3.5" fill="var(--blue)" stroke="var(--bg)" stroke-width="1.5" />
				{/each}
			</svg>
			<div class="chart-legend">
				<span class="legend-item"><span class="legend-swatch swatch-bar"></span>Daily spend</span>
				<span class="legend-item"><span class="legend-swatch swatch-line"></span>Spend trend</span>
			</div>
		</div>
	</section>

	{#if data.insights.length}
		<section class="section">
			<p class="label section-label">Insights</p>
			<div class="card insights-card">
				{#each data.insights as line, i (i)}
					<p class="insight-line">{line}</p>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.goals.length}
		<section class="section">
			<p class="label section-label">Goals</p>
			<div class="card-list">
				{#each data.goals as g (g.id)}
					{@const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))}
					<div class="card goal-card">
						<div class="goal-head">
							<p class="row-title">{g.name}</p>
							<p class="row-sub">{fmt(g.currentAmount)} / {fmt(g.targetAmount)}</p>
						</div>
						<div class="bar-wrap"><div class="bar-fill" style="width:{pct}%"></div></div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.spendByCategory.length}
		<section class="section">
			<p class="label section-label">Recent spending by category</p>
			<div class="card">
				{#each data.spendByCategory as c (c.category)}
					<div class="cat-row">
						<span class="cat-name">{c.category}</span>
						<span class="cat-amt">{fmt(c.amount)}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<section class="section">
		<p class="label section-label">Recent transactions</p>
		<div class="card">
			{#each data.transactions as t (t.id)}
				<div class="tx-row">
					<div>
						<p class="row-title">{t.merchant}</p>
						<p class="row-sub">{t.category} · {new Date(t.occurredAt).toLocaleDateString()}</p>
					</div>
					<p class="row-value" class:negative={t.amount < 0}>{fmt(t.amount)}</p>
				</div>
			{/each}
		</div>
	</section>
</main>

<style>
	.vibes-page {
		display: flex;
		flex-direction: column;
		gap: 26px;
		padding-top: 24px;
	}
	.hero-card {
		text-align: center;
		padding: 28px 20px;
	}
	.hero-value {
		font-family: var(--font-display);
		font-size: 42px;
		color: var(--gold);
		margin: 6px 0;
	}
	.hero-note {
		font-size: 11px;
		color: var(--text-3);
		max-width: 320px;
		margin: 6px auto 0;
	}
	.section-label {
		margin-bottom: 10px;
	}
	.card-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.row-card,
	.tx-row,
	.cat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.tx-row,
	.cat-row {
		padding: 10px 0;
		border-bottom: 1px solid var(--border);
	}
	.tx-row:last-child,
	.cat-row:last-child {
		border-bottom: none;
	}
	.row-title {
		font-size: 14px;
		color: var(--text-1);
	}
	.row-sub {
		font-size: 11px;
		color: var(--text-3);
		margin-top: 2px;
	}
	.row-value {
		font-family: var(--font-display);
		font-size: 17px;
		color: var(--green);
	}
	.row-value.negative {
		color: var(--red);
	}
	.cat-name {
		font-size: 13px;
		color: var(--text-2);
	}
	.cat-amt {
		font-family: var(--font-display);
		font-size: 15px;
		color: var(--text-1);
	}
	.goal-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.goal-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.bar-wrap {
		height: 6px;
		background: var(--surface-3);
		border-radius: 4px;
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		background: var(--purple);
		border-radius: 4px;
	}
	.chart-card {
		padding: 16px 10px 10px;
	}
	.bar-chart {
		width: 100%;
		height: auto;
		display: block;
	}
	.chart-legend {
		display: flex;
		gap: 18px;
		justify-content: center;
		margin-top: 10px;
	}
	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--text-3);
	}
	.legend-swatch {
		width: 10px;
		height: 10px;
		border-radius: 3px;
		display: inline-block;
	}
	.swatch-bar {
		background: var(--purple);
	}
	.swatch-line {
		background: var(--blue);
	}
	.insights-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.insight-line {
		font-size: 13px;
		color: var(--text-2);
		line-height: 1.55;
		padding-left: 12px;
		border-left: 2px solid var(--purple);
	}
</style>
