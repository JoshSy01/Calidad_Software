import postgres from 'postgres';
import { hashPassword, generateRandomString } from 'better-auth/crypto';

const connectionString =
	process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/imperio_db';
const sql = postgres(connectionString);

async function seed() {
	const email = 'joshuajvb0@gmail.com';
	const password = 'Pruebas123';
	const name = 'Usuario de Pruebas';

	console.log(`Hashing password for ${email}...`);
	const hashedPassword = await hashPassword(password);

	const userId = generateRandomString(32);
	const accountId = generateRandomString(32);
	const now = new Date();

	console.log(`Checking existing user with email ${email}...`);
	const existingUsers = await sql`SELECT id FROM public."user" WHERE email = ${email}`;

	if (existingUsers.length > 0) {
		const existingId = existingUsers[0].id;
		console.log(`User already exists with ID: ${existingId}. Updating password in account...`);

		await sql`
            UPDATE public.account
            SET password = ${hashedPassword}, updated_at = ${now}
            WHERE user_id = ${existingId} AND provider_id = 'credential'
        `;
		console.log('Password updated successfully!');
	} else {
		console.log(`Inserting user ${email}...`);
		await sql`
            INSERT INTO public."user" (id, name, email, email_verified, created_at, updated_at)
            VALUES (${userId}, ${name}, ${email}, true, ${now}, ${now})
        `;

		console.log(`Inserting account for userId ${userId}...`);
		await sql`
            INSERT INTO public.account (
                id,
                issuer,
                account_id,
                provider_id,
                user_id,
                password,
                created_at,
                updated_at
            )
            VALUES (
                ${accountId},
                'local:credential',
                ${userId},
                'credential',
                ${userId},
                ${hashedPassword},
                ${now},
                ${now}
            )
        `;
		console.log('User and account created successfully!');
	}

	await sql.end();
}

seed().catch(async (err) => {
	console.error('Error seeding user:', err);
	await sql.end();
	process.exit(1);
});
