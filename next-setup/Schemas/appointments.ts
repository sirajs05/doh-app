import { boolean, integer, numeric, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const flareSeverityEnum = pgEnum('flare_severity', ['minimal', 'moderate', 'severe']);
export const conditionKindEnum = pgEnum('condition_kind', ['acute', 'chronic']);

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  detail: text('detail').notNull(),
  apptType: text('appt_type').notNull(),
  apptAt: timestamp('appt_at').notNull(),
  cost: numeric('cost', { precision: 12, scale: 2 }),
  covered: boolean('covered').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  severity: flareSeverityEnum('severity').notNull(),
  kind: conditionKindEnum('kind').notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
