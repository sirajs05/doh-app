import { pgTable, serial, integer, text, timestamp, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const moodEnum = pgEnum('mood', ['great', 'good', 'okay', 'stressed', 'overwhelmed']);
export const conditionKindEnum = pgEnum('condition_kind', ['condition', 'allergy']);
export const flareSeverityEnum = pgEnum('flare_severity', ['mild', 'moderate', 'severe']);

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: roleEnum('role').notNull().default('user'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Session tokens are stored hashed (sha256 of the raw cookie value) — see $lib/server/auth.ts.
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at').notNull()
});

export const moodEntries = pgTable('mood_entries', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	mood: moodEnum('mood').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// ── Placeholder financial data ──────────────────────────────────────
// There's no real bank/financial API wired up yet. These tables hold
// arbitrary mock data (seeded by src/lib/server/db/seed.ts) for the
// test@test.com account so the Vibes dashboard has something to show.
export const mockAccounts = pgTable('mock_accounts', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	type: text('type').notNull(), // 'checking' | 'savings' | 'credit'
	balance: numeric('balance', { precision: 12, scale: 2, mode: 'number' }).notNull()
});

export const mockTransactions = pgTable('mock_transactions', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	merchant: text('merchant').notNull(),
	category: text('category').notNull(),
	amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(), // negative = spend, positive = income
	occurredAt: timestamp('occurred_at').notNull()
});

export const mockGoals = pgTable('mock_goals', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	targetAmount: numeric('target_amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
	currentAmount: numeric('current_amount', { precision: 12, scale: 2, mode: 'number' }).notNull()
});

// A monthly budget for a spending category (currently used by the Health
// page's nutrition breakdown, matched against mock_transactions).
export const mockBudgets = pgTable('mock_budgets', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	category: text('category').notNull(),
	monthlyBudget: numeric('monthly_budget', { precision: 12, scale: 2, mode: 'number' }).notNull()
});

// ── Health page ──────────────────────────────────────────────────────
export const healthConditions = pgTable('health_conditions', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	kind: conditionKindEnum('kind').notNull(),
	emoji: text('emoji').notNull(),
	label: text('label').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insurancePlans = pgTable('insurance_plans', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
		.unique(),
	planName: text('plan_name').notNull(),
	provider: text('provider').notNull(),
	memberId: text('member_id').notNull(),
	monthlyPremium: numeric('monthly_premium', { precision: 12, scale: 2, mode: 'number' }).notNull(),
	annualDeductible: numeric('annual_deductible', { precision: 12, scale: 2, mode: 'number' }).notNull(),
	deductibleMet: numeric('deductible_met', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
	primaryCopay: numeric('primary_copay', { precision: 12, scale: 2, mode: 'number' }).notNull(),
	specialistCopay: numeric('specialist_copay', { precision: 12, scale: 2, mode: 'number' }).notNull(),
	outOfPocketMax: numeric('out_of_pocket_max', { precision: 12, scale: 2, mode: 'number' }).notNull(),
	renewsOn: text('renews_on').notNull(),
	active: boolean('active').notNull().default(true)
});

export const medications = pgTable('medications', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	dosage: text('dosage').notNull(),
	frequency: text('frequency').notNull(),
	reason: text('reason').notNull(),
	monthlyCost: numeric('monthly_cost', { precision: 12, scale: 2, mode: 'number' }).notNull(),
	refillDate: timestamp('refill_date').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const appointments = pgTable('appointments', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	detail: text('detail').notNull(),
	apptType: text('appt_type').notNull(), // 'primary' | 'specialist' | 'preventive'
	apptAt: timestamp('appt_at').notNull(),
	cost: numeric('cost', { precision: 12, scale: 2, mode: 'number' }),
	covered: boolean('covered').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const flareUps = pgTable('flare_ups', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	severity: flareSeverityEnum('severity').notNull(),
	symptoms: text('symptoms').array().notNull(),
	triggers: text('triggers').array().notNull(),
	notes: text('notes'),
	extraCost: numeric('extra_cost', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
	occurredAt: timestamp('occurred_at').notNull()
});
