import { integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  reason: text('reason').notNull(),
  monthlyCost: numeric('monthly_cost', { precision: 12, scale: 2 }).notNull(),
  refillDate: timestamp('refill_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
