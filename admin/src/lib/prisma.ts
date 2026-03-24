import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getConnectionUrl = () => {
  return process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
};

const createPrismaClient = () => {
  const pool = new Pool({ connectionString: getConnectionUrl() });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_NODE !== 'production') globalForPrisma.prisma = prisma;
