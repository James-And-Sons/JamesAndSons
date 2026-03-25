import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error('Missing environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoConfirmEmail: true,
  }
});

async function main() {
  const email = 'admin@jamesandsons.in';
  const password = 'Shalom23$';

  console.log(`Creating superadmin: ${email}...`);

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    if (!authError.message.includes('already registered')) {
        process.exit(1);
    }
    console.log('User might already exist in Auth, attempting to sync with Database...');
  }

  const userId = authData.user?.id;
  
  // If user already exists, we might need to fetch their ID
  let finalUserId = userId;
  if (!finalUserId) {
    const { data: userData } = await supabase.auth.admin.listUsers();
    const existingUser = userData.users.find(u => u.email === email);
    if (existingUser) {
        finalUserId = existingUser.id;
    } else {
        console.error('Could not find or create user.');
        process.exit(1);
    }
  }

  console.log(`Auth User ID: ${finalUserId}`);

  // 2. Create user in Prisma Database
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({ adapter });

  try {
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        id: finalUserId, // Ensure ID matches Auth
      },
      create: {
        id: finalUserId,
        email,
        password: 'PASSWORD_MANAGED_BY_SUPABASE', // Placeholder
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    console.log('Successfully synced user to database:', dbUser);
  } catch (dbError) {
    console.error('Error syncing user to database:', dbError);
  } finally {
    await prisma.$disconnect();
  }
}

main();
