import { integer, numeric, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAmt: numeric('target_amt', { precision: 12, scale: 2 }).notNull(),
  currentAmt: numeric('current_amt', { precision: 12, scale: 2 }).default('0.00').notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
