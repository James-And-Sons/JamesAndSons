'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function approveB2BUser(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'B2B_BUYER' }
    });
    
    revalidatePath('/b2b');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectB2BUser(userId: string, companyId: string) {
  try {
    // If rejected, we disconnect or remove the company. 
    // Simply nullifying the companyId is safest, or deleting the company record if it was generated purely for this app.
    await prisma.user.update({
      where: { id: userId },
      data: { companyId: null }
    });
    
    // Optionally delete the company if no one else is attached to it
    const otherUsers = await prisma.user.count({ where: { companyId } });
    if (otherUsers === 0) {
      await prisma.company.delete({ where: { id: companyId } });
    }
    
    revalidatePath('/b2b');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
