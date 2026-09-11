import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | undefined;

/**
 * Returns the Drizzle client, creating it on first use.
 * Throws only when actually called without DATABASE_URL set,
 * so pages that don't touch the database still load.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set. Add it to your .env file.');
	}
	_db ??= drizzle(neon(env.DATABASE_URL), { schema });
	return _db;
}
