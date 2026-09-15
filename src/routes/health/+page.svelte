<script lang="ts">
	import NavBar from '$lib/components/NavBar.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
	const fmtDate = (d: string | Date) =>
		new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

	const SYMPTOMS = ['Headache', 'Fatigue', 'Nausea', 'Congestion', 'Itchy eyes', 'Rash', 'Low appetite', 'Fever'];
	const TRIGGERS = [
		'Stress',
		'Poor sleep',
		'Missed medication',
		'Pollen/Allergens',
		'Certain foods',
		'Alcohol',
		'Dehydration',
		'Unknown'
	];
	const SEVERITIES = [
		{ value: 'mild', label: '🟢 Mild', color: 'var(--green)' },
		{ value: 'moderate', label: '🟡 Moderate', color: 'var(--gold)' },
		{ value: 'severe', label: '🔴 Severe', color: 'var(--red)' }
	];

	let showAddCondition = $state(false);
	let showAddAppt = $state(false);
	let showAddMed = $state(false);
	let showFlareForm = $state(false);
	let insuranceExpanded = $state(false);

	function daysUntil(d: string | Date) {
		return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
	}

	function severityMeta(value: string) {
		return SEVERITIES.find((s) => s.value === value) ?? SEVERITIES[0];
	}
</script>

<NavBar email={data.email} active="health" />

<main class="page health-page">
	<div class="divider-row">
		<div class="divider-line"></div>
		<span class="label">Your health</span>
		<div class="divider-line"></div>
	</div>

	<section class="card overview-card">
		<p class="label">Monthly health spend</p>
		<div class="overview-row">
			<div class="ov-cell">
				<p class="ov-val">{fmt(data.overview.insurancePremium)}</p>
				<p class="ov-lbl">Insurance</p>
			</div>
			<div class="ov-cell">
				<p class="ov-val">{fmt(data.overview.medsTotal)}</p>
				<p class="ov-lbl">Medications</p>
			</div>
			<div class="ov-cell">
				<p class="ov-val">{fmt(data.overview.copaysDue)}</p>
				<p class="ov-lbl">Copays due</p>
			</div>
			<div class="ov-cell total">
				<p class="ov-val">{fmt(data.overview.totalPerMonth)}</p>
				<p class="ov-lbl">Total / mo</p>
			</div>
		</div>
	</section>

	<!-- Conditions & Allergies -->
	<section class="card">
		<div class="card-head">
			<p class="card-title">Conditions &amp; Allergies</p>
			<button class="link-btn" type="button" onclick={() => (showAddCondition = !showAddCondition)}>
				{showAddCondition ? 'Cancel' : '+ Add'}
			</button>
		</div>
		<div class="chip-row">
			{#each data.conditions as c (c.id)}
				<div class="chip" class:allergy={c.kind === 'allergy'}>
					<span>{c.emoji} {c.label}</span>
					<form method="POST" action="?/removeCondition" class="chip-form">
						<input type="hidden" name="id" value={c.id} />
						<button class="chip-x" type="submit" aria-label="Remove">✕</button>
					</form>
				</div>
			{/each}
			{#if data.conditions.length === 0}
				<p class="empty-note">Nothing logged yet.</p>
			{/if}
		</div>
		{#if showAddCondition}
			<form method="POST" action="?/addCondition" class="inline-form">
				<select class="input select" name="kind">
					<option value="condition">Condition</option>
					<option value="allergy">Allergy</option>
				</select>
				<input class="input" name="label" placeholder="e.g. Asthma, Shellfish allergy…" required />
				{#if form?.conditionError}<p class="error-text">{form.conditionError}</p>{/if}
				<button class="btn btn-primary small" type="submit">Add</button>
			</form>
		{/if}
	</section>

	<!-- Insurance -->
	<section class="card">
		{#if data.plan}
			<button class="ins-toggle" type="button" onclick={() => (insuranceExpanded = !insuranceExpanded)}>
				<div class="ins-toggle-body">
					<div class="ins-toggle-top">
						<p class="card-title">Insurance</p>
						<span class="active-tag">{data.plan.active ? 'Active ✓' : 'Inactive'}</span>
					</div>
					<p class="ins-sub">{data.plan.provider} · {fmt(data.plan.monthlyPremium)}/mo</p>
				</div>
				<span class="chevron" class:open={insuranceExpanded}>⌄</span>
			</button>
			{#if insuranceExpanded}
				<div class="ins-body">
					<p class="ins-plan-name">{data.plan.planName}</p>
					<p class="ins-plan-sub">Member ID: {data.plan.memberId}</p>
					<div class="ins-grid">
						<div class="ins-cell">
							<p class="ins-lbl">Monthly premium</p>
							<p class="ins-val">{fmt(data.plan.monthlyPremium)}</p>
						</div>
						<div class="ins-cell">
							<p class="ins-lbl">Annual deductible</p>
							<p class="ins-val accent">{fmt(data.plan.annualDeductible)}</p>
							<div class="bar-wrap tiny">
								<div
									class="bar-fill"
									style="width:{Math.min(100, (data.plan.deductibleMet / data.plan.annualDeductible) * 100)}%"
								></div>
							</div>
							<p class="ins-note">{fmt(data.plan.deductibleMet)} met of {fmt(data.plan.annualDeductible)}</p>
						</div>
						<div class="ins-cell">
							<p class="ins-lbl">Primary copay</p>
							<p class="ins-val">{fmt(data.plan.primaryCopay)}</p>
						</div>
						<div class="ins-cell">
							<p class="ins-lbl">Specialist copay</p>
							<p class="ins-val">{fmt(data.plan.specialistCopay)}</p>
						</div>
						<div class="ins-cell">
							<p class="ins-lbl">Out-of-pocket max</p>
							<p class="ins-val">{fmt(data.plan.outOfPocketMax)}</p>
						</div>
						<div class="ins-cell">
							<p class="ins-lbl">Renews</p>
							<p class="ins-val">{data.plan.renewsOn}</p>
						</div>
					</div>
				</div>
			{/if}
		{:else}
			<p class="card-title">Insurance</p>
			<p class="empty-note">No plan on file.</p>
		{/if}
	</section>

	<!-- Appointments -->
	<section class="card">
		<div class="card-head">
			<p class="card-title">Appointments</p>
			<button class="link-btn" type="button" onclick={() => (showAddAppt = !showAddAppt)}>
				{showAddAppt ? 'Cancel' : '+ Add'}
			</button>
		</div>
		<div class="list">
			{#each data.appointments as a (a.id)}
				<div class="appt-row">
					<div>
						<p class="row-title">{a.name}</p>
						<p class="row-sub">{a.detail}</p>
						<p class="row-badge">{fmtDate(a.apptAt)} · {daysUntil(a.apptAt)}d away</p>
					</div>
					<div class="appt-cost">
						<p class="row-value">{a.covered ? 'Covered' : fmt(a.cost ?? 0)}</p>
						<p class="row-badge">{a.apptType}</p>
					</div>
				</div>
			{/each}
			{#if data.appointments.length === 0}
				<p class="empty-note">Nothing scheduled.</p>
			{/if}
		</div>
		{#if showAddAppt}
			<form method="POST" action="?/addAppointment" class="inline-form">
				<input class="input" name="name" placeholder="Appointment name" required />
				<input class="input" name="detail" placeholder="Detail (provider, reason…)" />
				<div class="two-col">
					<select class="input select" name="apptType">
						<option value="primary">Primary</option>
						<option value="specialist">Specialist</option>
						<option value="preventive">Preventive</option>
					</select>
					<input class="input" name="apptAt" type="date" required />
				</div>
				<div class="two-col">
					<input class="input" name="cost" type="number" step="0.01" min="0" placeholder="Cost ($)" />
					<label class="checkbox-row"><input type="checkbox" name="covered" /> Covered by insurance</label>
				</div>
				{#if form?.apptError}<p class="error-text">{form.apptError}</p>{/if}
				<button class="btn btn-primary small" type="submit">Add appointment</button>
			</form>
		{/if}
	</section>

	<!-- Medications -->
	<section class="card">
		<div class="card-head">
			<p class="card-title">Medications</p>
			<button class="link-btn" type="button" onclick={() => (showAddMed = !showAddMed)}>
				{showAddMed ? 'Cancel' : '+ Add'}
			</button>
		</div>
		<div class="list">
			{#each data.medications as m (m.id)}
				{@const soon = daysUntil(m.refillDate) <= 10}
				<div class="med-row">
					<div>
						<p class="row-title">{m.name}</p>
						<p class="row-sub">{m.dosage} · {m.frequency} · {m.reason}</p>
					</div>
					<div class="appt-cost">
						<p class="row-value">{fmt(m.monthlyCost)}/mo</p>
						<p class="row-badge" class:soon>Refill {fmtDate(m.refillDate)}</p>
					</div>
				</div>
			{/each}
			{#if data.medications.length === 0}
				<p class="empty-note">Nothing on file.</p>
			{/if}
		</div>
		{#if showAddMed}
			<form method="POST" action="?/addMedication" class="inline-form">
				<input class="input" name="name" placeholder="Medication name" required />
				<div class="two-col">
					<input class="input" name="dosage" placeholder="Dosage (e.g. 10mg)" />
					<input class="input" name="frequency" placeholder="Frequency (e.g. Daily)" />
				</div>
				<input class="input" name="reason" placeholder="Reason" />
				<div class="two-col">
					<input class="input" name="monthlyCost" type="number" step="0.01" min="0" placeholder="Cost / mo ($)" />
					<input class="input" name="refillDate" type="date" required />
				</div>
				{#if form?.medError}<p class="error-text">{form.medError}</p>{/if}
				<button class="btn btn-primary small" type="submit">Add medication</button>
			</form>
		{/if}
	</section>

	<!-- Flare-Up Tracker -->
	<section class="card">
		<div class="card-head">
			<p class="card-title">Flare-Up Tracker</p>
			<button class="link-btn" type="button" onclick={() => (showFlareForm = !showFlareForm)}>
				{showFlareForm ? 'Cancel' : '⊕ Report flare'}
			</button>
		</div>
		<div class="flare-stats">
			<div class="ov-cell">
				<p class="ov-val warn">{data.flareStats.countThisMonth}</p>
				<p class="ov-lbl">This month</p>
			</div>
			<div class="ov-cell">
				<p class="ov-val">{data.flareStats.avgDaysApart ? data.flareStats.avgDaysApart.toFixed(1) : '—'}</p>
				<p class="ov-lbl">Avg days apart</p>
			</div>
			<div class="ov-cell">
				<p class="ov-val warn">+{fmt(data.flareStats.extraSpendThisMonth)}</p>
				<p class="ov-lbl">Extra spend</p>
			</div>
		</div>

		{#if showFlareForm}
			<form method="POST" action="?/logFlareUp" class="inline-form">
				<p class="form-label">Severity</p>
				<div class="chip-select-row">
					{#each SEVERITIES as s (s.value)}
						<label class="radio-chip">
							<input type="radio" name="severity" value={s.value} required />
							<span>{s.label}</span>
						</label>
					{/each}
				</div>
				<p class="form-label">Symptoms</p>
				<div class="check-grid">
					{#each SYMPTOMS as s (s)}
						<label class="check-chip">
							<input type="checkbox" name="symptoms" value={s} />
							<span>{s}</span>
						</label>
					{/each}
				</div>
				<p class="form-label">Possible triggers</p>
				<div class="check-grid">
					{#each TRIGGERS as t (t)}
						<label class="check-chip">
							<input type="checkbox" name="triggers" value={t} />
							<span>{t}</span>
						</label>
					{/each}
				</div>
				<p class="form-label">Notes <span class="optional">(optional)</span></p>
				<textarea class="input textarea" name="notes" placeholder="How are you feeling? Anything else to note…"
				></textarea>
				<input class="input" name="extraCost" type="number" step="0.01" min="0" placeholder="Extra spend this flare ($, optional)" />
				{#if form?.flareError}<p class="error-text">{form.flareError}</p>{/if}
				<button class="btn btn-primary small" type="submit">🔥 Log flare-up</button>
			</form>
		{/if}

		<div class="flare-history">
			{#each data.flareUps as f (f.id)}
				{@const meta = severityMeta(f.severity)}
				<div class="flare-entry">
					<div class="flare-dot" style="background:{meta.color}"></div>
					<div class="flare-body">
						<p class="row-badge">{fmtDate(f.occurredAt)} · {meta.label.replace(/^[^ ]+ /, '')}</p>
						<p class="row-title">{f.symptoms.join(', ')}</p>
						{#if f.triggers.length}
							<p class="row-sub">Trigger: {f.triggers.join(', ').toLowerCase()}</p>
						{/if}
						{#if f.notes}
							<p class="row-sub">{f.notes}</p>
						{/if}
					</div>
					<p class="row-value warn">+{fmt(f.extraCost)}</p>
				</div>
			{/each}
			{#if data.flareUps.length === 0}
				<p class="empty-note">No flare-ups logged.</p>
			{/if}
		</div>

		{#if data.flareStats.stressTriggeredCount >= 2}
			<p class="flare-insight">
				📊 <strong>Pattern detected:</strong> most of your flare-ups this period followed stress or poor sleep.
				Worth mentioning to a provider at your next visit.
			</p>
		{/if}
	</section>

	<!-- Nutrition -->
	<section class="card">
		<div class="card-head">
			<p class="card-title">Nutrition</p>
			<p class="row-badge">{new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
		</div>
		<div class="nut-total-row">
			<div>
				<p class="nut-total">{fmt(data.nutrition.total)}</p>
				{#if data.nutrition.budget}
					<p class="row-sub">
						Budget: {fmt(data.nutrition.budget)}
						{#if data.nutrition.total > data.nutrition.budget}
							· <span class="warn-text">+{fmt(data.nutrition.total - data.nutrition.budget)} over</span>
						{:else}
							· <span class="ok-text">{fmt(data.nutrition.budget - data.nutrition.total)} left</span>
						{/if}
					</p>
				{/if}
			</div>
		</div>
		{#if data.nutrition.budget}
			<div class="bar-wrap">
				<div
					class="bar-fill"
					class:over={data.nutrition.total > data.nutrition.budget}
					style="width:{Math.min(100, (data.nutrition.total / data.nutrition.budget) * 100)}%"
				></div>
			</div>
		{/if}
		<div class="nut-rows">
			{#each data.nutrition.byCategory as c, i (c.category)}
				{@const colors = ['var(--purple)', 'var(--green)', 'var(--blue)', 'var(--gold)']}
				<div class="nut-row">
					<div class="nut-dot" style="background:{colors[i % colors.length]}"></div>
					<span class="nut-cat">{c.category}</span>
					<div class="bar-wrap sm">
						<div
							class="bar-fill"
							style="width:{Math.min(100, (c.amount / Math.max(1, data.nutrition.total)) * 100)}%; background:{colors[
								i % colors.length
							]}"
						></div>
					</div>
					<span class="nut-amt">{fmt(c.amount)}</span>
				</div>
			{/each}
			{#if data.nutrition.byCategory.length === 0}
				<p class="empty-note">No nutrition spending this month yet.</p>
			{/if}
		</div>
	</section>
</main>

<style>
	.health-page {
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding-top: 12px;
		padding-bottom: 60px;
	}
	.divider-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0 0;
	}
	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--border);
	}
	.overview-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		margin-top: 10px;
	}
	.ov-cell {
		text-align: center;
		background: var(--surface-2);
		border-radius: var(--radius-sm);
		padding: 12px 6px;
	}
	.ov-cell.total {
		background: var(--purple-dim);
	}
	.ov-val {
		font-family: var(--font-display);
		font-size: 20px;
		color: var(--text-1);
	}
	.ov-val.warn {
		color: var(--red);
	}
	.ov-lbl {
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-3);
		margin-top: 4px;
	}
	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.card-title {
		font-family: var(--font-display);
		font-size: 18px;
		color: var(--text-1);
	}
	.link-btn {
		background: none;
		border: none;
		color: var(--purple);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		padding: 4px;
	}
	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: 20px;
		padding: 7px 8px 7px 14px;
		font-size: 12px;
		color: var(--text-1);
	}
	.chip.allergy {
		border-color: rgba(201, 106, 106, 0.4);
	}
	.chip-form {
		display: contents;
	}
	.chip-x {
		background: var(--surface-3);
		border: none;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		font-size: 10px;
		color: var(--text-2);
		cursor: pointer;
	}
	.empty-note {
		font-size: 12px;
		color: var(--text-3);
	}
	.inline-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
	}
	.input {
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		padding: 10px 12px;
		color: var(--text-1);
		font-size: 13px;
		outline: none;
		font-family: var(--font-body);
		width: 100%;
	}
	.input:focus {
		border-color: var(--purple);
	}
	.select {
		appearance: auto;
	}
	.textarea {
		min-height: 64px;
		resize: vertical;
	}
	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.checkbox-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-2);
	}
	.btn.small {
		padding: 9px 16px;
		font-size: 12px;
		align-self: flex-start;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.appt-row,
	.med-row {
		display: flex;
		justify-content: space-between;
		gap: 14px;
		padding: 12px 0;
		border-bottom: 1px solid var(--border);
	}
	.appt-row:last-child,
	.med-row:last-child {
		border-bottom: none;
	}
	.row-title {
		font-size: 13px;
		color: var(--text-1);
	}
	.row-sub {
		font-size: 11px;
		color: var(--text-3);
		margin-top: 2px;
	}
	.row-badge {
		font-size: 10px;
		color: var(--text-3);
		margin-top: 3px;
	}
	.row-badge.soon {
		color: var(--gold);
	}
	.row-value {
		font-family: var(--font-display);
		font-size: 15px;
		color: var(--text-1);
		text-align: right;
	}
	.row-value.warn {
		color: var(--red);
	}
	.appt-cost {
		text-align: right;
		flex-shrink: 0;
	}
	.ins-toggle {
		width: 100%;
		background: none;
		border: none;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}
	.ins-toggle-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
	}
	.active-tag {
		font-size: 10px;
		color: var(--green);
	}
	.ins-sub {
		font-size: 11px;
		color: var(--text-2);
		margin-top: 3px;
	}
	.chevron {
		flex-shrink: 0;
		color: var(--text-3);
		transition: transform 0.15s;
		font-size: 18px;
	}
	.chevron.open {
		transform: rotate(180deg);
	}
	.ins-body {
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
	}
	.ins-plan-name {
		font-family: var(--font-display);
		font-size: 15px;
		color: var(--text-1);
	}
	.ins-plan-sub {
		font-size: 10px;
		color: var(--text-3);
		margin-top: 2px;
	}
	.ins-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 14px;
	}
	.ins-cell {
		background: var(--surface-2);
		border-radius: var(--radius-sm);
		padding: 10px 12px;
	}
	.ins-lbl {
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.ins-val {
		font-family: var(--font-display);
		font-size: 16px;
		color: var(--text-1);
		margin-top: 2px;
	}
	.ins-val.accent {
		color: var(--purple);
	}
	.ins-note {
		font-size: 9px;
		color: var(--text-3);
		margin-top: 4px;
	}
	.bar-wrap {
		height: 6px;
		background: var(--surface-3);
		border-radius: 4px;
		overflow: hidden;
		margin-top: 12px;
	}
	.bar-wrap.tiny {
		height: 4px;
		margin-top: 6px;
	}
	.bar-wrap.sm {
		flex: 1;
		height: 5px;
		margin-top: 0;
	}
	.bar-fill {
		height: 100%;
		background: var(--purple);
		border-radius: 4px;
	}
	.bar-fill.over {
		background: var(--red);
	}
	.flare-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 8px;
	}
	.form-label {
		font-size: 9px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-3);
		margin-top: 4px;
	}
	.optional {
		text-transform: none;
		letter-spacing: 0;
		font-weight: 400;
	}
	.chip-select-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.radio-chip,
	.check-chip {
		position: relative;
		cursor: pointer;
	}
	.radio-chip input,
	.check-chip input {
		position: absolute;
		opacity: 0;
	}
	.radio-chip span,
	.check-chip span {
		display: inline-block;
		padding: 7px 12px;
		border-radius: 20px;
		border: 1px solid var(--border-strong);
		font-size: 11px;
		color: var(--text-2);
		background: var(--surface-2);
	}
	.radio-chip input:checked + span,
	.check-chip input:checked + span {
		background: var(--purple-dim);
		border-color: var(--purple);
		color: var(--text-1);
	}
	.check-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}
	.flare-history {
		display: flex;
		flex-direction: column;
		margin-top: 6px;
	}
	.flare-entry {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px 0;
		border-bottom: 1px solid var(--border);
	}
	.flare-entry:last-child {
		border-bottom: none;
	}
	.flare-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		margin-top: 4px;
		flex-shrink: 0;
	}
	.flare-body {
		flex: 1;
	}
	.flare-insight {
		margin-top: 14px;
		padding: 12px 14px;
		background: var(--surface-2);
		border-radius: var(--radius-sm);
		font-size: 11px;
		color: var(--text-2);
		line-height: 1.6;
	}
	.flare-insight strong {
		color: var(--gold);
	}
	.nut-total-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.nut-total {
		font-family: var(--font-display);
		font-size: 26px;
		color: var(--text-1);
	}
	.warn-text {
		color: var(--red);
	}
	.ok-text {
		color: var(--green);
	}
	.nut-rows {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 14px;
	}
	.nut-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.nut-dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex-shrink: 0;
	}
	.nut-cat {
		font-size: 12px;
		color: var(--text-2);
		width: 100px;
		flex-shrink: 0;
	}
	.nut-amt {
		font-family: var(--font-display);
		font-size: 13px;
		color: var(--text-1);
		width: 60px;
		text-align: right;
		flex-shrink: 0;
	}
</style>
