import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

// ─────────────────────────────────────────────────────────────
// ADMIN-ONLY: Bulk coupon code generation
// POST /api/v1/coupons/generate
// Headers: Authorization: Bearer <ADMIN_API_TOKEN>
// Body: { count, type, value, expiresAt?, source?, prefix?, minOrderAmount?, affiliateId? }
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      count = 10,
      type = 'PERCENTAGE',
      value,
      expiresAt,
      source = 'internal',
      prefix = 'JNS',
      minOrderAmount,
      affiliateId,
    } = body;

    if (!value) return NextResponse.json({ error: 'value is required' }, { status: 400 });
    if (count > 10000) return NextResponse.json({ error: 'Max 10,000 codes per request' }, { status: 400 });

    const codes: string[] = [];
    const created: string[] = [];
    const pfx = prefix.toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

    while (codes.length < count) {
      const code = `${pfx}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      if (!codes.includes(code)) codes.push(code);
    }

    for (const code of codes) {
      try {
        await prisma.coupon.create({
          data: {
            code,
            type,
            value: Number(value),
            usageLimit: 1,
            usageLimitPerUser: 1,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            source,
            affiliateId: affiliateId || undefined,
            minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
          },
        });
        created.push(code);
      } catch {
        // Skip if there's a rare collision
      }
    }

    return NextResponse.json({
      success: true,
      generated: created.length,
      codes: created,
    });
  } catch (error: any) {
    console.error('[/api/v1/coupons/generate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
