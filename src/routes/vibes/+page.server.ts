import { fail, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import {
	appointments,
	mockAccounts,
	mockBudgets,
	mockGoals,
	mockTransactions,
	moodEntries
} from '$lib/server/db/schema';
import { MOODS, type MoodValue } from '$lib/moods';
import type { Actions, PageServerLoad } from './$types';

const NUTRITION_CATEGORIES = ['Groceries', 'Dining', 'Food Delivery'];

/** Mood → 1..5 score, so the line can be drawn on a numeric scale. */
const MOOD_SCORE: Record<MoodValue, number> = {
	overwhelmed: 1,
	stressed: 2,
	okay: 3,
	good: 4,
	great: 5
};

function startOfDay(d: Date) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function daysBetween(a: Date, b: Date) {
	return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'user') throw redirect(303, '/login');

	const userId = locals.user.id;
	const today = startOfDay(new Date());

	const weekStart = new Date(today);
	weekStart.setDate(weekStart.getDate() - 6);

	const [accounts, allTransactions, goals, weekMoods, budgets, upcomingAppointments] =
		await Promise.all([
			getDb().select().from(mockAccounts).where(eq(mockAccounts.userId, userId)),
			getDb()
				.select()
				.from(mockTransactions)
				.where(eq(mockTransactions.userId, userId))
				.orderBy(desc(mockTransactions.occurredAt)),
			getDb().select().from(mockGoals).where(eq(mockGoals.userId, userId)),
			getDb()
				.select()
				.from(moodEntries)
				.where(and(eq(moodEntries.userId, userId), gte(moodEntries.createdAt, weekStart)))
				.orderBy(moodEntries.createdAt),
			getDb().select().from(mockBudgets).where(eq(mockBudgets.userId, userId)),
			getDb()
				.select()
				.from(appointments)
				.where(and(eq(appointments.userId, userId), gte(appointments.apptAt, today)))
				.orderBy(asc(appointments.apptAt))
		]);

	const recentTransactions = allTransactions.slice(0, 8);

	const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

	const spendByCategory = new Map<string, number>();
	for (const t of recentTransactions) {
		if (t.amount < 0) {
			spendByCategory.set(t.category, (spendByCategory.get(t.category) ?? 0) + Math.abs(t.amount));
		}
	}

	// ── Last 7 days of spending + mood, for the chart ──
	const dailySpend: {
		label: string;
		date: Date;
		amount: number;
		mood: MoodValue | null;
		moodScore: number | null;
	}[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		dailySpend.push({
			label: d.toLocaleDateString('en-US', { weekday: 'short' }),
			date: d,
			amount: 0,
			mood: null,
			moodScore: null
		});
	}
	for (const t of allTransactions) {
		if (t.amount >= 0) continue;
		const diff = daysBetween(today, t.occurredAt);
		if (diff >= 0 && diff <= 6) {
			const bucket = dailySpend[6 - diff];
			bucket.amount += Math.abs(t.amount);
		}
	}
	// Mood entries are ordered oldest → newest, so if someone checked in twice
	// in one day the later answer wins.
	for (const m of weekMoods) {
		const diff = daysBetween(today, m.createdAt);
		if (diff >= 0 && diff <= 6) {
			const bucket = dailySpend[6 - diff];
			bucket.mood = m.mood;
			bucket.moodScore = MOOD_SCORE[m.mood];
		}
	}

	// ── Insights, generated from the same mock data ──
	const insights: string[] = [];

	const thisWeekTotal = dailySpend.reduce((s, d) => s + d.amount, 0);
	const lastWeekTotal = allTransactions
		.filter((t) => t.amount < 0)
		.filter((t) => {
			const diff = daysBetween(today, t.occurredAt);
			return diff >= 7 && diff <= 13;
		})
		.reduce((s, t) => s + Math.abs(t.amount), 0);

	const peakDay = dailySpend.reduce((max, d) => (d.amount > max.amount ? d : max), dailySpend[0]);
	if (peakDay.amount > 0) {
		insights.push(
			`Your highest-spending day this week was ${peakDay.label}, at ${fmt(peakDay.amount)}.`
		);
	}

	if (lastWeekTotal > 0) {
		const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
		const direction = change >= 0 ? 'more' : 'less';
		insights.push(
			`You've spent ${Math.abs(Math.round(change))}% ${direction} this week (${fmt(thisWeekTotal)}) than last week (${fmt(lastWeekTotal)}).`
		);
	} else if (thisWeekTotal > 0) {
		insights.push(`You've spent ${fmt(thisWeekTotal)} in the last 7 days.`);
	}

	const weekCategoryTotals = new Map<string, number>();
	for (const t of allTransactions) {
		if (t.amount >= 0) continue;
		const diff = daysBetween(today, t.occurredAt);
		if (diff >= 0 && diff <= 6) {
			weekCategoryTotals.set(t.category, (weekCategoryTotals.get(t.category) ?? 0) + Math.abs(t.amount));
		}
	}
	let topCategory: { category: string; amount: number } | null = null;
	for (const [category, amount] of weekCategoryTotals) {
		if (!topCategory || amount > topCategory.amount) topCategory = { category, amount };
	}
	if (topCategory) {
		insights.push(`${topCategory.category} was your biggest category this week, at ${fmt(topCategory.amount)}.`);
	}

	// Mood vs. spend: compare average spend on rough days vs. good days.
	const roughDays = dailySpend.filter((d) => d.moodScore !== null && d.moodScore <= 2);
	const goodDays = dailySpend.filter((d) => d.moodScore !== null && d.moodScore >= 4);
	if (roughDays.length && goodDays.length) {
		const avg = (days: typeof dailySpend) =>
			days.reduce((s, d) => s + d.amount, 0) / days.length;
		const roughAvg = avg(roughDays);
		const goodAvg = avg(goodDays);
		if (roughAvg > goodAvg * 1.15) {
			insights.push(
				`On days you felt stressed or overwhelmed you spent about ${fmt(roughAvg)} on average, versus ${fmt(goodAvg)} on good days.`
			);
		} else if (goodAvg > roughAvg * 1.15) {
			insights.push(
				`You actually spent more on good days (${fmt(goodAvg)} avg) than on rough ones (${fmt(roughAvg)} avg) this week.`
			);
		} else {
			insights.push(`Your spending stayed about the same regardless of how you were feeling this week.`);
		}
	}
	const checkedInDays = dailySpend.filter((d) => d.mood !== null).length;
	if (checkedInDays > 0 && checkedInDays < 7) {
		insights.push(
			`You checked in ${checkedInDays} of the last 7 days — the mood line fills in as you keep checking in.`
		);
	}

	// ── "A note from doh": one short, personal nudge built from this user's data ──
	const todayMood = dailySpend[6].mood;
	const displayName = (() => {
		const local = locals.user.email.split('@')[0];
		return local.charAt(0).toUpperCase() + local.slice(1);
	})();

	const lastPaycheck = allTransactions.find((t) => t.amount > 0 && t.category === 'Income');
	const paydayDaysAgo = lastPaycheck ? daysBetween(today, lastPaycheck.occurredAt) : null;

	const nutritionBudget = budgets.find((b) => b.category === 'Nutrition')?.monthlyBudget ?? null;
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	const nutritionSpent = allTransactions
		.filter((t) => t.amount < 0 && NUTRITION_CATEGORIES.includes(t.category))
		.filter((t) => t.occurredAt >= monthStart)
		.reduce((s, t) => s + Math.abs(t.amount), 0);
	const nutritionPct =
		nutritionBudget && nutritionBudget > 0 ? Math.round((nutritionSpent / nutritionBudget) * 100) : null;
	const daysLeftInMonth =
		new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();

	const nextDue = upcomingAppointments.find((a) => !a.covered && (a.cost ?? 0) > 0) ?? null;
	const nextDueInDays = nextDue ? daysBetween(nextDue.apptAt, today) : null;

	const creditOwed = accounts
		.filter((a) => a.type === 'credit' && a.balance < 0)
		.reduce((s, a) => s + Math.abs(a.balance), 0);
	const savings = accounts.filter((a) => a.type === 'savings').reduce((s, a) => s + a.balance, 0);

	const activeGoal = goals
		.map((g) => ({ ...g, pct: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) }))
		.filter((g) => g.pct < 100)
		.sort((a, b) => b.pct - a.pct)[0];

	const inDays = (n: number) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`);

	let note: string;
	if (todayMood === 'overwhelmed' || todayMood === 'stressed') {
		const cushion = savings > 0 ? ` You've got ${fmt(savings)} set aside, and that isn't going anywhere.` : '';
		const weekNote =
			lastWeekTotal > 0 && thisWeekTotal < lastWeekTotal
				? ` For what it's worth, you've actually spent less this week than last.`
				: '';
		note = `Money feels heavy today, and that's allowed. Nothing here needs solving right now.${cushion}${weekNote}`;
	} else if (paydayDaysAgo !== null && paydayDaysAgo <= 1) {
		const target = activeGoal ? `toward "${activeGoal.name}"` : 'into savings';
		note = `It's payday — a good day to move something before it disappears into the week. Even $20 ${target} right now puts you closer to a month where money feels easy.`;
	} else if (nutritionPct !== null && nutritionPct >= 80) {
		note = `Your food budget is at ${nutritionPct}% with ${daysLeftInMonth} days left in the month. A couple of home-cooked nights this week would take the pressure off.`;
	} else if (nextDue && nextDueInDays !== null && nextDueInDays <= 3) {
		note = `Your ${nextDue.name.toLowerCase()} is ${inDays(nextDueInDays)}, and the ${fmt(nextDue.cost ?? 0)} copay is already in view — no surprises there.`;
	} else if (todayMood === 'great' || todayMood === 'good') {
		const goalLine = activeGoal
			? ` "${activeGoal.name}" is ${activeGoal.pct}% funded — a good day to nudge it a little further.`
			: '';
		note = `Good energy today.${goalLine} Small moves on good days are what make the rough days easier.`;
	} else if (activeGoal) {
		note = `"${activeGoal.name}" is ${activeGoal.pct}% of the way there. You don't have to do anything about it today — just know it's moving.`;
	} else {
		note = `Nothing urgent in your money today. Checking in like this, even when it's boring, is how it stays boring.`;
	}

	const chips: string[] = [];
	if (paydayDaysAgo !== null && paydayDaysAgo <= 7) {
		chips.push(paydayDaysAgo === 0 ? 'Payday today' : `Payday ${paydayDaysAgo}d ago`);
	}
	if (nutritionPct !== null) chips.push(`Food budget at ${nutritionPct}%`);
	if (nextDue && nextDueInDays !== null) {
		chips.push(`${fmt(nextDue.cost ?? 0).replace('.00', '')} due ${inDays(nextDueInDays)}`);
	} else if (creditOwed > 0) {
		chips.push(`${fmt(creditOwed).replace('.00', '')} on your card`);
	}

	return {
		email: locals.user.email,
		displayName,
		todayMood,
		note,
		chips: chips.slice(0, 3),
		netWorth,
		accounts,
		transactions: recentTransactions,
		goals,
		spendByCategory: Array.from(spendByCategory, ([category, amount]) => ({ category, amount })),
		dailySpend: dailySpend.map((d) => ({
			label: d.label,
			amount: d.amount,
			mood: d.mood,
			moodScore: d.moodScore
		})),
		insights
	};
};

export const actions: Actions = {
	checkIn: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'user') throw redirect(303, '/login');

		const form = await request.formData();
		const mood = String(form.get('mood') ?? '');
		if (!MOODS.some((m) => m.value === mood)) {
			return fail(400, { checkInError: 'Pick one of the moods.' });
		}

		await getDb()
			.insert(moodEntries)
			.values({ userId: locals.user.id, mood: mood as MoodValue });

		return { checkedIn: true };
	}
};
