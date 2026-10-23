import { pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'premium_user', 'admin']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique('users_email_unique'),
  passwordHash: text('password_hash').notNull(),
  username: text('username').notNull().unique('users_username_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  role: roleEnum('role').default('user').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
