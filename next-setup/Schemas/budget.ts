import { integer, numeric, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const budget = pgTable('budget', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  monthlyBudget: numeric('monthly_budget', { precision: 12, scale: 2 }).notNull(),
});

export type Budget = typeof budget.$inferSelect;
export type NewBudget = typeof budget.$inferInsert;
