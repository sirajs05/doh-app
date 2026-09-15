// Run with: npm run db:seed
// Resets and re-seeds the test account, the admin account, and a handful of
// sample users (with mood check-ins) so the admin dashboard has something to
// show. Uses its own DB connection (not $lib/server/db's getDb()) so this
// script can run standalone via `tsx`, outside of SvelteKit/Vite.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcryptjs';
import * as schema from './schema';
import {
	users,
	mockAccounts,
	mockTransactions,
	mockGoals,
	mockBudgets,
	moodEntries,
	sessions,
	healthConditions,
	insurancePlans,
	medications,
	appointments,
	flareUps
} from './schema';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set. Add it to your .env file before seeding.');
}

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

const MOOD_VALUES = ['great', 'good', 'okay', 'stressed', 'overwhelmed'] as const;

function daysAgo(n: number) {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d;
}

function daysFromNow(n: number) {
	return daysAgo(-n);
}

async function main() {
	console.log('Clearing existing seed data...');
	await db.delete(sessions);
	await db.delete(moodEntries);
	await db.delete(flareUps);
	await db.delete(appointments);
	await db.delete(medications);
	await db.delete(insurancePlans);
	await db.delete(healthConditions);
	await db.delete(mockBudgets);
	await db.delete(mockTransactions);
	await db.delete(mockGoals);
	await db.delete(mockAccounts);
	await db.delete(users);

	console.log('Creating the test account and the admin account...');
	const [testUser] = await db
		.insert(users)
		.values({
			email: 'test@test.com',
			passwordHash: await bcrypt.hash('password123', 12),
			role: 'user'
		})
		.returning();

	await db.insert(users).values({
		email: 'admin@doh.app',
		passwordHash: await bcrypt.hash('Admin123!', 12),
		role: 'admin'
	});

	console.log('Seeding mock financial data for the test user...');
	await db.insert(mockAccounts).values([
		{ userId: testUser.id, name: 'Everyday Checking', type: 'checking', balance: 2340.55 },
		{ userId: testUser.id, name: 'Emergency Savings', type: 'savings', balance: 8120.0 },
		{ userId: testUser.id, name: 'Rewards Credit Card', type: 'credit', balance: -540.25 }
	]);

	await db.insert(mockGoals).values([
		{ userId: testUser.id, name: 'Emergency fund', targetAmount: 10000, currentAmount: 8120 },
		{ userId: testUser.id, name: 'Pay off credit card', targetAmount: 540.25, currentAmount: 0 }
	]);

	await db.insert(mockBudgets).values([{ userId: testUser.id, category: 'Nutrition', monthlyBudget: 350 }]);

	await db.insert(mockTransactions).values([
		{ userId: testUser.id, merchant: 'Paycheck', category: 'Income', amount: 2100, occurredAt: daysAgo(2) },
		{ userId: testUser.id, merchant: 'Rent', category: 'Housing', amount: -1450, occurredAt: daysAgo(3) },
		{
			userId: testUser.id,
			merchant: "Trader Joe's",
			category: 'Groceries',
			amount: -86.42,
			occurredAt: daysAgo(4)
		},
		{ userId: testUser.id, merchant: 'Metro Transit', category: 'Transport', amount: -32, occurredAt: daysAgo(0) },
		{
			userId: testUser.id,
			merchant: 'Netflix',
			category: 'Subscriptions',
			amount: -15.49,
			occurredAt: daysAgo(6)
		},
		{
			userId: testUser.id,
			merchant: 'Blue Bottle Coffee',
			category: 'Dining',
			amount: -6.75,
			occurredAt: daysAgo(2)
		},
		{
			userId: testUser.id,
			merchant: "Trader Joe's",
			category: 'Groceries',
			amount: -54.1,
			occurredAt: daysAgo(9)
		},
		{ userId: testUser.id, merchant: 'Chipotle', category: 'Dining', amount: -13.2, occurredAt: daysAgo(3) },
		{
			userId: testUser.id,
			merchant: 'Spotify',
			category: 'Subscriptions',
			amount: -11.99,
			occurredAt: daysAgo(12)
		},
		{
			userId: testUser.id,
			merchant: 'Shell Gas Station',
			category: 'Transport',
			amount: -41.3,
			occurredAt: daysAgo(13)
		},
		{ userId: testUser.id, merchant: 'DoorDash', category: 'Food Delivery', amount: -28.5, occurredAt: daysAgo(1) },
		{ userId: testUser.id, merchant: 'Uber Eats', category: 'Food Delivery', amount: -19.75, occurredAt: daysAgo(7) },
		{ userId: testUser.id, merchant: 'Chipotle', category: 'Dining', amount: -11.4, occurredAt: daysAgo(1) },
		{ userId: testUser.id, merchant: "Trader Joe's", category: 'Groceries', amount: -61.3, occurredAt: daysAgo(0) }
	]);

	console.log('Seeding Health page data for the test user...');
	await db.insert(healthConditions).values([
		{ userId: testUser.id, kind: 'allergy', emoji: '🥜', label: 'Peanut allergy' },
		{ userId: testUser.id, kind: 'condition', emoji: '🤧', label: 'Seasonal allergies' }
	]);

	await db.insert(insurancePlans).values({
		userId: testUser.id,
		planName: 'Student Health Plan',
		provider: 'Campus Blue Shield',
		memberId: 'DOH-2026-10432',
		monthlyPremium: 45,
		annualDeductible: 500,
		deductibleMet: 0,
		primaryCopay: 20,
		specialistCopay: 40,
		outOfPocketMax: 2000,
		renewsOn: 'Aug 2027',
		active: true
	});

	await db.insert(medications).values([
		{
			userId: testUser.id,
			name: 'Multivitamin',
			dosage: '1 tablet',
			frequency: 'Daily',
			reason: 'General wellness',
			monthlyCost: 8,
			refillDate: daysFromNow(20)
		},
		{
			userId: testUser.id,
			name: 'Cetirizine (allergy relief)',
			dosage: '10mg',
			frequency: 'As needed',
			reason: 'Seasonal allergies',
			monthlyCost: 6,
			refillDate: daysFromNow(9)
		},
		{
			userId: testUser.id,
			name: 'Vitamin D3',
			dosage: '2000 IU',
			frequency: 'Daily',
			reason: 'General wellness',
			monthlyCost: 5,
			refillDate: daysFromNow(35)
		}
	]);

	await db.insert(appointments).values([
		{
			userId: testUser.id,
			name: 'Annual physical',
			detail: 'Dr. Nguyen · Campus Health Center · Routine check-up',
			apptType: 'primary',
			apptAt: daysFromNow(18),
			cost: 20,
			covered: false
		},
		{
			userId: testUser.id,
			name: 'Allergist follow-up',
			detail: 'Dr. Patel · Allergy & Immunology · Review seasonal symptoms',
			apptType: 'specialist',
			apptAt: daysFromNow(32),
			cost: 40,
			covered: false
		},
		{
			userId: testUser.id,
			name: 'Nutrition consult',
			detail: 'Campus Wellness · Budget-friendly meal planning',
			apptType: 'preventive',
			apptAt: daysFromNow(10),
			cost: 0,
			covered: true
		}
	]);

	await db.insert(flareUps).values([
		{
			userId: testUser.id,
			severity: 'moderate',
			symptoms: ['Congestion', 'Itchy eyes'],
			triggers: ['Pollen/Allergens'],
			notes: 'High pollen count day.',
			extraCost: 15,
			occurredAt: daysAgo(5)
		},
		{
			userId: testUser.id,
			severity: 'mild',
			symptoms: ['Headache'],
			triggers: ['Poor sleep'],
			notes: null,
			extraCost: 8,
			occurredAt: daysAgo(11)
		},
		{
			userId: testUser.id,
			severity: 'severe',
			symptoms: ['Rash', 'Itchy eyes', 'Congestion'],
			triggers: ['Pollen/Allergens', 'Missed medication'],
			notes: 'Forgot allergy meds for a couple of days.',
			extraCost: 25,
			occurredAt: daysAgo(16)
		}
	]);

	console.log('Seeding sample users + mood check-ins for the admin dashboard...');
	const sampleEmails = [
		'alice@example.com',
		'ben@example.com',
		'carla@example.com',
		'derek@example.com',
		'elena@example.com',
		'farid@example.com',
		'grace@example.com',
		'hassan@example.com'
	];

	for (const email of sampleEmails) {
		const [sampleUser] = await db
			.insert(users)
			.values({ email, passwordHash: await bcrypt.hash('sampleuser123', 12), role: 'user' })
			.returning();

		const entryCount = 1 + Math.floor(Math.random() * 4);
		for (let i = 0; i < entryCount; i++) {
			const mood = MOOD_VALUES[Math.floor(Math.random() * MOOD_VALUES.length)];
			await db
				.insert(moodEntries)
				.values({ userId: sampleUser.id, mood, createdAt: daysAgo(Math.floor(Math.random() * 14)) });
		}
	}

	console.log('\nDone.');
	console.log('Test user login:  test@test.com / password123');
	console.log('Admin login:      admin@doh.app / Admin123!');
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
