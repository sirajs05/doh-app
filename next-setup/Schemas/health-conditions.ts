import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const healthConditions = pgTable('health_conditions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type HealthCondition = typeof healthConditions.$inferSelect;
export type NewHealthCondition = typeof healthConditions.$inferInsert;
