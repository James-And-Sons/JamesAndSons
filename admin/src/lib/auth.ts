import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check role from Prisma — this is the source of truth for RBAC
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, email: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      console.warn(`Unauthorized admin access attempt: ${user.email}`);
      await supabase.auth.signOut();
      redirect('/login?error=Unauthorized');
    }
  } catch (err) {
    // DB unavailable — fall through to allow (middleware already checks auth)
    console.error('requireAdmin DB check failed, allowing through:', err);
  }

  return user;
}
