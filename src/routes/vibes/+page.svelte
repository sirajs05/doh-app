<script lang="ts">
	import { enhance } from '$app/forms';
	import NavBar from '$lib/components/NavBar.svelte';
	import { MOODS } from '$lib/moods';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

	let submittingMood = $state<string | null>(null);

	// Chart geometry. The bars use the left ~300px; a slim mood axis sits on the right.
	const chartW = 340;
	const chartH = 150;
	const baseline = 118;
	const plotTop = 22;
	const plotH = baseline - plotTop;
	const barW = 26;
	const plotW = 300;
	let gap = $derived((plotW - data.dailySpend.length * barW) / (data.dailySpend.length + 1));
	let maxAmount = $derived(Math.max(1, ...data.dailySpend.map((d) => d.amount)));

	// Mood line: score 1..5 mapped onto the same vertical space as the bars.
	const moodY = (score: number) => baseline - ((score - 1) / 4) * plotH;
	const moodMeta = (value: string | null) => MOODS.find((m) => m.value === value) ?? null;

	let moodPoints = $derived(
		data.dailySpend.flatMap((d, i) =>
			d.moodScore === null
				? []
				: [
						{
							x: gap + i * (barW + gap) + barW / 2,
							y: moodY(d.moodScore),
							mood: d.mood,
							color: moodMeta(d.mood)?.color ?? 'var(--text-1)',
							emoji: moodMeta(d.mood)?.emoji ?? ''
						}
					]
		)
	);
	let moodPolyline = $derived(moodPoints.map((p) => `${p.x},${p.y}`).join(' '));
	let hasMoodData = $derived(moodPoints.length > 0);
</script>

<NavBar email={data.email} active="vibes" />

<main class="page vibes-page">
	<h1 class="greeting">{data.displayName}</h1>

	<!-- ── Daily check-in ── -->
	<section class="card checkin-card">
		<p class="checkin-q">How are you feeling about your finances today?</p>
		<form
			method="POST"
			action="?/checkIn"
			use:enhance={({ formData }) => {
				submittingMood = String(formData.get('mood') ?? '');
				return async ({ update }) => {
					await update({ reset: false });
					submittingMood = null;
				};
			}}
		>
			<div class="checkin-row">
				{#each MOODS as m (m.value)}
					<button
						type="submit"
						name="mood"
						value={m.value}
						class="checkin-btn"
						class:sel={data.todayMood === m.value}
						class:busy={submittingMood === m.value}
						style="--accent:{m.color}"
						aria-pressed={data.todayMood === m.value}
					>
						<span class="checkin-emoji">{m.emoji}</span>
						<span class="checkin-label">{m.label}</span>
					</button>
				{/each}
			</div>
		</form>
		{#if form?.checkInError}
			<p class="error-text">{form.checkInError}</p>
		{:else if data.todayMood}
			<p class="checkin-note">
				Logged for today — tap another to change it.
			</p>
		{:else}
			<p class="checkin-note">You haven't checked in yet today.</p>
		{/if}
	</section>

	<!-- ── A note from doh ── -->
	<section class="card note-card">
		<p class="label">A note from doh</p>
		<p class="note-text">“{data.note}”</p>
		{#if data.chips.length}
			<div class="chip-row">
				{#each data.chips as chip (chip)}
					<span class="chip">{chip}</span>
				{/each}
			</div>
		{/if}
	</section>

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
		<p class="label section-label">Spending vs. mood this week</p>
		<div class="card chart-card">
			<svg viewBox="0 0 {chartW} {chartH}" class="bar-chart" role="img" aria-label="Daily spending bars with a mood line overlaid">
				<!-- faint guide lines for the mood scale -->
				{#each [1, 3, 5] as score (score)}
					<line
						x1="0"
						y1={moodY(score)}
						x2={plotW}
						y2={moodY(score)}
						stroke="var(--border)"
						stroke-width="1"
						stroke-dasharray="3 4"
					/>
				{/each}
				<line x1="0" y1={baseline} x2={plotW} y2={baseline} stroke="var(--border-strong)" stroke-width="1" />

				<!-- mood axis on the right -->
				<text x={plotW + 12} y={moodY(5) + 4} font-size="11" text-anchor="start">😄</text>
				<text x={plotW + 12} y={moodY(3) + 4} font-size="11" text-anchor="start">😐</text>
				<text x={plotW + 12} y={moodY(1) + 4} font-size="11" text-anchor="start">😣</text>

				<!-- spending bars -->
				{#each data.dailySpend as d, i (i)}
					{@const x = gap + i * (barW + gap)}
					{@const h = Math.max(2, (d.amount / maxAmount) * plotH)}
					<rect
						x={x}
						y={baseline - h}
						width={barW}
						height={h}
						rx="5"
						fill={d.amount === maxAmount ? 'var(--gold)' : 'var(--purple)'}
						opacity={d.amount === 0 ? 0.25 : 0.55}
					/>
					<text
						x={x + barW / 2}
						y={baseline + 16}
						text-anchor="middle"
						font-family="Fredoka"
						font-size="10"
						fill="var(--text-3)">{d.label}</text
					>
					<text
						x={x + barW / 2}
						y={baseline - h - 5}
						text-anchor="middle"
						font-family="Fredoka"
						font-size="8"
						fill="var(--text-2)">{d.amount > 0 ? fmt(d.amount).replace('.00', '') : ''}</text
					>
				{/each}

				<!-- mood line, drawn on top of the bars -->
				{#if hasMoodData}
					<polyline
						points={moodPolyline}
						fill="none"
						stroke="var(--text-1)"
						stroke-width="2"
						stroke-linejoin="round"
						stroke-linecap="round"
					/>
					{#each moodPoints as p, i (i)}
						<circle cx={p.x} cy={p.y} r="5" fill={p.color} stroke="var(--bg)" stroke-width="2">
							<title>{moodMeta(p.mood)?.label}</title>
						</circle>
					{/each}
				{/if}
			</svg>

			{#if !hasMoodData}
				<p class="chart-empty">
					No mood check-ins in the last 7 days yet — the mood line will appear once you've checked in.
				</p>
			{/if}

			<div class="chart-legend">
				<span class="legend-item"><span class="legend-swatch swatch-bar"></span>Money spent (bars)</span>
				<span class="legend-item"><span class="legend-line"></span>Mood (line)</span>
			</div>
			<div class="mood-key">
				{#each MOODS as m (m.value)}
					<span class="mood-key-item">
						<span class="mood-dot" style="background:{m.color}"></span>{m.emoji} {m.label}
					</span>
				{/each}
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
	.greeting {
		font-size: 34px;
		color: var(--text-1);
		margin-bottom: -8px;
	}

	/* ── check-in card ── */
	.checkin-card {
		padding: 22px 20px 16px;
	}
	.checkin-q {
		font-family: var(--font-display);
		font-size: 19px;
		color: var(--text-1);
		margin-bottom: 18px;
	}
	.checkin-row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
	}
	.checkin-btn {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 14px 4px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		color: var(--text-3);
		transition:
			border-color 0.15s,
			background 0.15s,
			transform 0.1s,
			color 0.15s;
	}
	.checkin-btn:hover {
		border-color: var(--accent);
		color: var(--text-2);
	}
	.checkin-btn:active {
		transform: scale(0.97);
	}
	.checkin-btn.sel {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 16%, var(--surface-2));
		color: var(--text-1);
	}
	.checkin-btn.busy {
		opacity: 0.6;
	}
	.checkin-emoji {
		font-size: 24px;
		line-height: 1;
	}
	.checkin-label {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.checkin-note {
		font-size: 11px;
		color: var(--text-3);
		margin-top: 12px;
	}
	@media (max-width: 480px) {
		.checkin-emoji {
			font-size: 20px;
		}
		.checkin-label {
			font-size: 9px;
		}
	}

	/* ── note card ── */
	.note-card {
		padding: 22px 22px 20px;
		background: linear-gradient(160deg, var(--purple-dim), var(--surface-1) 65%);
	}
	.note-text {
		font-family: var(--font-display);
		font-size: 20px;
		line-height: 1.45;
		color: var(--text-1);
		margin: 12px 0 18px;
	}
	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text-2);
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		padding: 6px 12px;
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
		background: linear-gradient(90deg, var(--purple), var(--gold));
	}
	.legend-line {
		width: 18px;
		height: 0;
		border-top: 2px solid var(--text-1);
		display: inline-block;
		position: relative;
	}
	.legend-line::after {
		content: '';
		position: absolute;
		left: 6px;
		top: -4px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--green);
		border: 1px solid var(--bg);
	}
	.chart-empty {
		font-size: 11px;
		color: var(--text-3);
		text-align: center;
		margin-top: 6px;
	}
	.mood-key {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px 14px;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid var(--border);
	}
	.mood-key-item {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 10px;
		color: var(--text-3);
	}
	.mood-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
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
