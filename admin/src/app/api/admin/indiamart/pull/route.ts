import { pullIndiaMartLeads } from '@/lib/sync/indiamart';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const maxDuration = 60; // Allow 60 seconds

export async function POST(req: NextRequest) {
  try {
    const { startTime, endTime } = await req.json().catch(() => ({}));
    
    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    const result = await pullIndiaMartLeads(start, end);

    revalidatePath('/rfqs');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[IndiaMART Pull API Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to pull IndiaMART leads' },
      { status: 500 }
    );
  }
}
