import type { Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await getUserFromSession(event.cookies);
	return resolve(event);
};
