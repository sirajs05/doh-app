import { redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { mockAccounts, mockGoals, mockTransactions } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

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

	const [accounts, allTransactions, goals] = await Promise.all([
		getDb().select().from(mockAccounts).where(eq(mockAccounts.userId, userId)),
		getDb()
			.select()
			.from(mockTransactions)
			.where(eq(mockTransactions.userId, userId))
			.orderBy(desc(mockTransactions.occurredAt)),
		getDb().select().from(mockGoals).where(eq(mockGoals.userId, userId))
	]);

	const recentTransactions = allTransactions.slice(0, 8);

	const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

	const spendByCategory = new Map<string, number>();
	for (const t of recentTransactions) {
		if (t.amount < 0) {
			spendByCategory.set(t.category, (spendByCategory.get(t.category) ?? 0) + Math.abs(t.amount));
		}
	}

	// ── Last 7 days of spending, for the bar chart ──
	const dailySpend: { label: string; date: Date; amount: number }[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		dailySpend.push({
			label: d.toLocaleDateString('en-US', { weekday: 'short' }),
			date: d,
			amount: 0
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

	return {
		email: locals.user.email,
		netWorth,
		accounts,
		transactions: recentTransactions,
		goals,
		spendByCategory: Array.from(spendByCategory, ([category, amount]) => ({ category, amount })),
		dailySpend: dailySpend.map((d) => ({ label: d.label, amount: d.amount })),
		insights
	};
};
