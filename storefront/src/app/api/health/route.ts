import { NextResponse } from 'next/server';
import { prisma } from '@james-andsons/db';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch (error: any) {
    dbStatus = `unhealthy: ${error.message || 'Connection failed'}`;
  }

  const status = dbStatus === 'healthy' ? 200 : 503;

  return NextResponse.json(
    {
      service: 'james-and-sons-storefront',
      status: dbStatus === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
        },
        environment: process.env.NODE_ENV || 'development',
      },
    },
    { status }
  );
}
