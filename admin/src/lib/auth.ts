import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const whitelisted = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  const adminEmails = [
    'abhishikt@growth-ho.com',
    'admin@jamesandsons.in',
    'vishal@jamesandsons.in',
    'james@jamesandsons.in',

    ...whitelisted
  ];

  if (!adminEmails.includes(user.email || '')) {
    console.warn(`Unauthorized admin access attempt: ${user.email}`);
    redirect('/login?error=Unauthorized');
  }


  return user;
}
