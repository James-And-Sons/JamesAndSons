'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBlogPost(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const isDraft = formData.get('isDraft') === 'true';

  // Get first admin user for now as author
  const author = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!author) {
    throw new Error('No admin user found to author the post');
  }

  await prisma.blogPost.create({
    data: {
      title,
      slug: slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      isDraft,
      authorId: author.id
    }
  });

  revalidatePath('/blog');
  revalidatePath('/(storefront)/blog', 'layout');
  redirect('/blog');
}

export async function updateBlogPost(id: number, formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const isDraft = formData.get('isDraft') === 'true';

  await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      content,
      excerpt,
      isDraft
    }
  });

  revalidatePath('/blog');
  revalidatePath('/(storefront)/blog', 'layout');
  redirect('/blog');
}

export async function deleteBlogPost(id: number) {
  await prisma.blogPost.delete({
    where: { id }
  });

  revalidatePath('/blog');
  revalidatePath('/(storefront)/blog', 'layout');
}
