import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getConnectionUrl = () => {
  let url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is MISSING');
    throw new Error('DATABASE_URL is not defined in environment variables');
  }
  
  console.log(`DATABASE_URL detected: length=${url.length}, prefix=${url.substring(0, 15)}...`);

  // Ensure sslmode=require is present for Supabase
  if (!url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  return url;
};

const createPrismaClient = () => {
  const url = getConnectionUrl();
  console.log(`Initializing Pool with URL length: ${url.length}`);
  
  const pool = new Pool({ 
    connectionString: url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Test pool error handling
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
