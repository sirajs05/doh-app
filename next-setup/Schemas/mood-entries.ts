import { integer, pgEnum, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const moodEnum = pgEnum('mood', ['great', 'good', 'okay', 'stressed', 'overwhelmed']);

export const moodEntries = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mood: moodEnum('mood').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type MoodEntry = typeof moodEntries.$inferSelect;
export type NewMoodEntry = typeof moodEntries.$inferInsert;
