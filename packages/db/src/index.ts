import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getConnectionUrl = () => {
  const url =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/jamesandsons";
  return url;
};

const createPrismaClient = () => {
  const url = getConnectionUrl();

  const pool = new Pool({
    connectionString: url,
    max: 2, // Optimized for serverless environments
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
export * from "@prisma/client";
export { PrismaClient } from "@prisma/client";
export { PrismaPg } from "@prisma/adapter-pg";
