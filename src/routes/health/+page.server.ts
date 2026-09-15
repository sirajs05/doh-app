import { fail, redirect } from '@sveltejs/kit';
import { asc, desc, eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import {
	healthConditions,
	insurancePlans,
	medications,
	appointments,
	flareUps,
	mockTransactions,
	mockBudgets
} from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

const NUTRITION_CATEGORIES = ['Groceries', 'Dining', 'Food Delivery'];

function requireUser(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'user') throw redirect(303, '/login');
	return locals.user;
}

function isSameMonth(a: Date, b: Date) {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const userId = user.id;
	const now = new Date();

	const [conditions, [plan], meds, appts, flares, transactions, [budget]] = await Promise.all([
		getDb().select().from(healthConditions).where(eq(healthConditions.userId, userId)),
		getDb().select().from(insurancePlans).where(eq(insurancePlans.userId, userId)),
		getDb().select().from(medications).where(eq(medications.userId, userId)).orderBy(asc(medications.refillDate)),
		getDb().select().from(appointments).where(eq(appointments.userId, userId)).orderBy(asc(appointments.apptAt)),
		getDb().select().from(flareUps).where(eq(flareUps.userId, userId)).orderBy(desc(flareUps.occurredAt)),
		getDb().select().from(mockTransactions).where(eq(mockTransactions.userId, userId)),
		getDb()
			.select()
			.from(mockBudgets)
			.where(and(eq(mockBudgets.userId, userId), eq(mockBudgets.category, 'Nutrition')))
	]);

	const medsTotal = meds.reduce((s, m) => s + m.monthlyCost, 0);
	const upcomingAppts = appts.filter((a) => a.apptAt >= now);
	const copaysDue = upcomingAppts.reduce((s, a) => s + (a.covered ? 0 : (a.cost ?? 0)), 0);
	const insurancePremium = plan?.monthlyPremium ?? 0;
	const totalPerMonth = insurancePremium + medsTotal + copaysDue;

	const flaresThisMonth = flares.filter((f) => isSameMonth(f.occurredAt, now));
	const sortedAsc = [...flares].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
	let avgDaysApart: number | null = null;
	if (sortedAsc.length >= 2) {
		let totalDays = 0;
		for (let i = 1; i < sortedAsc.length; i++) {
			totalDays += (sortedAsc[i].occurredAt.getTime() - sortedAsc[i - 1].occurredAt.getTime()) / 86_400_000;
		}
		avgDaysApart = totalDays / (sortedAsc.length - 1);
	}
	const extraSpendThisMonth = flaresThisMonth.reduce((s, f) => s + f.extraCost, 0);

	const stressTriggeredCount = flares.filter((f) =>
		f.triggers.some((t) => t.toLowerCase().includes('stress') || t.toLowerCase().includes('sleep'))
	).length;

	const nutritionTotals = new Map<string, number>();
	let nutritionTotal = 0;
	for (const t of transactions) {
		if (t.amount >= 0) continue;
		if (!isSameMonth(t.occurredAt, now)) continue;
		if (!NUTRITION_CATEGORIES.includes(t.category)) continue;
		const amt = Math.abs(t.amount);
		nutritionTotals.set(t.category, (nutritionTotals.get(t.category) ?? 0) + amt);
		nutritionTotal += amt;
	}

	return {
		email: user.email,
		conditions,
		plan,
		medications: meds,
		appointments: appts,
		flareUps: flares,
		overview: {
			insurancePremium,
			medsTotal,
			copaysDue,
			totalPerMonth
		},
		flareStats: {
			countThisMonth: flaresThisMonth.length,
			avgDaysApart,
			extraSpendThisMonth,
			stressTriggeredCount,
			totalFlares: flares.length
		},
		nutrition: {
			total: nutritionTotal,
			budget: budget?.monthlyBudget ?? null,
			byCategory: Array.from(nutritionTotals, ([category, amount]) => ({ category, amount }))
		}
	};
};

export const actions: Actions = {
	addCondition: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const kind = String(form.get('kind') ?? 'condition');
		const label = String(form.get('label') ?? '').trim();

		if (!label) return fail(400, { conditionError: 'Enter a name.' });
		if (kind !== 'condition' && kind !== 'allergy') return fail(400, { conditionError: 'Invalid type.' });

		await getDb()
			.insert(healthConditions)
			.values({
				userId: user.id,
				kind,
				emoji: kind === 'allergy' ? '⚠️' : '🩺',
				label
			});
	},

	removeCondition: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, {});

		await getDb()
			.delete(healthConditions)
			.where(and(eq(healthConditions.id, id), eq(healthConditions.userId, user.id)));
	},

	addAppointment: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const detail = String(form.get('detail') ?? '').trim();
		const apptType = String(form.get('apptType') ?? 'primary');
		const dateStr = String(form.get('apptAt') ?? '');
		const costStr = String(form.get('cost') ?? '').trim();
		const covered = form.get('covered') === 'on';

		if (!name || !dateStr) return fail(400, { apptError: 'Enter a name and a date.' });

		const apptAt = new Date(dateStr);
		if (Number.isNaN(apptAt.getTime())) return fail(400, { apptError: 'That date is not valid.' });

		await getDb()
			.insert(appointments)
			.values({
				userId: user.id,
				name,
				detail: detail || '—',
				apptType,
				apptAt,
				cost: covered || !costStr ? (covered ? null : 0) : Number(costStr),
				covered
			});
	},

	addMedication: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const dosage = String(form.get('dosage') ?? '').trim();
		const frequency = String(form.get('frequency') ?? '').trim();
		const reason = String(form.get('reason') ?? '').trim();
		const monthlyCost = Number(form.get('monthlyCost') ?? 0);
		const refillDateStr = String(form.get('refillDate') ?? '');

		if (!name || !refillDateStr) return fail(400, { medError: 'Enter a name and a refill date.' });

		const refillDate = new Date(refillDateStr);
		if (Number.isNaN(refillDate.getTime())) return fail(400, { medError: 'That refill date is not valid.' });

		await getDb()
			.insert(medications)
			.values({
				userId: user.id,
				name,
				dosage: dosage || '—',
				frequency: frequency || '—',
				reason: reason || '—',
				monthlyCost,
				refillDate
			});
	},

	logFlareUp: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const severity = String(form.get('severity') ?? '');
		const symptoms = form.getAll('symptoms').map(String);
		const triggers = form.getAll('triggers').map(String);
		const notes = String(form.get('notes') ?? '').trim();
		const extraCostStr = String(form.get('extraCost') ?? '').trim();

		if (severity !== 'mild' && severity !== 'moderate' && severity !== 'severe') {
			return fail(400, { flareError: 'Pick a severity.' });
		}
		if (symptoms.length === 0) {
			return fail(400, { flareError: 'Pick at least one symptom.' });
		}

		await getDb()
			.insert(flareUps)
			.values({
				userId: user.id,
				severity,
				symptoms,
				triggers,
				notes: notes || null,
				extraCost: extraCostStr ? Number(extraCostStr) : 0,
				occurredAt: new Date()
			});
	}
};
