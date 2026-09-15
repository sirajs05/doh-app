import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { getDb } from './db';
import { sessions, users } from './db/schema';

const SESSION_COOKIE = 'doh_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function hashPassword(password: string) {
	return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

/** Creates a session for the given user and sets the session cookie. */
export async function createSession(userId: number, cookies: Cookies) {
	const token = randomBytes(32).toString('hex');
	const id = hashToken(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await getDb().insert(sessions).values({ id, userId, expiresAt });

	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		expires: expiresAt
	});
}

/** Reads the session cookie (if any) and returns the logged-in user, or null. */
export async function getUserFromSession(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const id = hashToken(token);
	const [row] = await getDb()
		.select({ user: users, session: sessions })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, id));

	if (!row) return null;

	if (row.session.expiresAt < new Date()) {
		await getDb().delete(sessions).where(eq(sessions.id, id));
		return null;
	}

	return row.user;
}

/** Deletes the current session (if any) and clears the cookie. */
export async function destroySession(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		await getDb().delete(sessions).where(eq(sessions.id, hashToken(token)));
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
