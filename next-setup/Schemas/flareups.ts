import { integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const flareUps = pgTable('flare_ups', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symptoms: text('symptoms').array().notNull(),
  triggers: text('triggers').array(),
  notes: text('notes'),
  extraCost: numeric('extra_cost', { precision: 12, scale: 2 }).default('0').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
});

export type FlareUp = typeof flareUps.$inferSelect;
export type NewFlareUp = typeof flareUps.$inferInsert;
