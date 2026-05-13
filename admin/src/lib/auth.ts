import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has admin role or is in the whitelist
  // Based on your previous setup, we check the user's email
  const adminEmails = [
    'abhishikt@growth-ho.com',
    'vishal@jamesandsons.in',
    'james@jamesandsons.in'
  ];

  if (!adminEmails.includes(user.email || '')) {
    redirect('/login?error=Unauthorized');
  }

  return user;
}
