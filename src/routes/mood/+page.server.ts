import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { moodEntries } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

const VALID_MOODS = ['great', 'good', 'okay', 'stressed', 'overwhelmed'] as const;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'user') throw redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'user') throw redirect(303, '/login');

		const form = await request.formData();
		const mood = String(form.get('mood') ?? '');

		if (!VALID_MOODS.includes(mood as (typeof VALID_MOODS)[number])) {
			return fail(400, { error: 'Pick one of the options below.' });
		}

		await getDb()
			.insert(moodEntries)
			.values({ userId: locals.user.id, mood: mood as (typeof VALID_MOODS)[number] });

		throw redirect(303, '/vibes');
	}
};
