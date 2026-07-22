import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function ensureHolidaysSeeded() {
  const count = await prisma.indianHoliday.count();
  if (count > 0) return;

  const currentYear = new Date().getFullYear();
  const defaultHolidays = [
    { name: 'Raksha Bandhan', date: new Date(`${currentYear}-08-28T00:00:00Z`), isMajor: true },
    { name: 'Ganesh Chaturthi', date: new Date(`${currentYear}-09-17T00:00:00Z`), isMajor: true },
    { name: 'Durga Puja', date: new Date(`${currentYear}-10-12T00:00:00Z`), isMajor: true },
    { name: 'Karwa Chauth', date: new Date(`${currentYear}-10-20T00:00:00Z`), isMajor: true },
    { name: 'Dhanteras', date: new Date(`${currentYear}-11-08T00:00:00Z`), isMajor: true },
    { name: 'Diwali', date: new Date(`${currentYear}-11-10T00:00:00Z`), isMajor: true },
    { name: 'Christmas', date: new Date(`${currentYear}-12-25T00:00:00Z`), isMajor: true },
    { name: 'New Year Eve', date: new Date(`${currentYear + 1}-01-01T00:00:00Z`), isMajor: true },
    { name: 'Holi', date: new Date(`${currentYear + 1}-03-25T00:00:00Z`), isMajor: true }
  ];

  await prisma.indianHoliday.createMany({
    data: defaultHolidays
  });
}

export async function GET(req: NextRequest) {
  try {
    await ensureHolidaysSeeded();

    const holidays = await prisma.indianHoliday.findMany({
      orderBy: { date: 'asc' },
      include: {
        campaigns: {
          select: { id: true, name: true, status: true, stage: true }
        }
      }
    });

    const now = new Date();
    const enriched = holidays.map(h => {
      const diffMs = new Date(h.date).getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        ...h,
        daysRemaining
      };
    });

    return NextResponse.json({ holidays: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, date, isMajor } = await req.json();
    if (!name || !date) {
      return NextResponse.json({ error: 'Name and date are required' }, { status: 400 });
    }

    const holiday = await prisma.indianHoliday.create({
      data: {
        name,
        date: new Date(date),
        isMajor: isMajor ?? true
      }
    });

    return NextResponse.json({ holiday });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create holiday' }, { status: 500 });
  }
}
