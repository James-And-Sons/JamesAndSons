'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createBlogPost(data: { title: string; slug: string; excerpt: string; content: string; authorId: string; isDraft: boolean }) {
  try {
    await prisma.blogPost.create({ data });
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBlogPost(id: number, data: { title: string; slug: string; excerpt: string; content: string; isDraft: boolean }) {
  try {
    await prisma.blogPost.update({ where: { id }, data });
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBlogPost(id: number) {
  try {
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
