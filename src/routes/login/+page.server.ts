import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createSession, verifyPassword } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role === 'user') throw redirect(303, '/vibes');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Enter your email and password.' });
		}

		const [account] = await getDb()
			.select()
			.from(users)
			.where(and(eq(users.email, email), eq(users.role, 'user')));

		if (!account || !(await verifyPassword(password, account.passwordHash))) {
			return fail(400, { email, error: 'Incorrect email or password.' });
		}

		await createSession(account.id, cookies);
		throw redirect(303, '/mood');
	}
};
