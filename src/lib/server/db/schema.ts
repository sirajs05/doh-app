import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Example table so `drizzle-kit push` has something to create.
// Rename/extend this (or add more tables) to fit your app.
export const items = pgTable('items', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});
