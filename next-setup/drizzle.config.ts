import {loadEnvConfig} from '@next/env';
import { defineConfig } from 'drizzle-kit';

loadEnvConfig(process.cwd(), true);

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set. Add it to your .env file before running drizzle-kit.');
}

export default defineConfig({
	dialect: 'postgresql',
	schema: './Schemas/*.ts',
	out: './drizzle',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
});

