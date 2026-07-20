'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { calculateShippingRateAction } from '@/app/checkout/actions';

export async function checkPincode(pincode: string, weightKg: number, subtotal: number) {
  try {
    const res = await calculateShippingRateAction(pincode, weightKg, subtotal);
    
    // If user is logged in, save this pincode for their account
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && user.email) {
      await prisma.user.update({
        where: { email: user.email },
        data: { lastPincode: pincode }
      });
    }
    
    return res;
  } catch (error) {
    console.error('Error checking/saving pincode:', error);
    return null;
  }
}

export async function getSavedPincode() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { lastPincode: true }
      });
      return dbUser?.lastPincode || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting saved pincode:', error);
    return null;
  }
}
