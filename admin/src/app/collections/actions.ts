'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addProductToCollection(categoryId: string, productId: string) {
  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        products: {
          connect: { id: productId }
        }
      }
    });
    revalidatePath('/collections');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeProductFromCollection(categoryId: string, productId: string) {
  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        products: {
          disconnect: { id: productId }
        }
      }
    });
    revalidatePath('/collections');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
