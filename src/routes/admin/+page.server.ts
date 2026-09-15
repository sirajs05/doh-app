import { redirect } from '@sveltejs/kit';
import { count, desc, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { moodEntries, users } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(303, '/admin/login');

	const [[{ totalUsers }], [{ totalCheckIns }], moodCounts, recentCheckIns] = await Promise.all([
		getDb().select({ totalUsers: count() }).from(users).where(eq(users.role, 'user')),
		getDb().select({ totalCheckIns: count() }).from(moodEntries),
		getDb().select({ mood: moodEntries.mood, total: count() }).from(moodEntries).groupBy(moodEntries.mood),
		getDb()
			.select({ email: users.email, mood: moodEntries.mood, createdAt: moodEntries.createdAt })
			.from(moodEntries)
			.innerJoin(users, eq(moodEntries.userId, users.id))
			.orderBy(desc(moodEntries.createdAt))
			.limit(15)
	]);

	return {
		email: locals.user.email,
		totalUsers,
		totalCheckIns,
		moodCounts,
		recentCheckIns
	};
};
