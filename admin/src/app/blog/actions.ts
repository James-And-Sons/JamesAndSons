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

  const metaTitle = formData.get('metaTitle') as string;
  const metaDesc = formData.get('metaDesc') as string;
  const geoTakeaway = formData.get('geoTakeaway') as string;
  
  const faqJson = formData.get('faqJson') as string;
  const citationsJson = formData.get('citationsJson') as string;

  const faq = faqJson ? JSON.parse(faqJson) : [];
  const citations = citationsJson ? JSON.parse(citationsJson) : [];

  const parsedMetaTitle = metaTitle || `${title} | James & Sons`;
  const parsedMetaDesc = metaDesc || excerpt || (content ? content.substring(0, 155).replace(/\r?\n|\r/g, " ") + '...' : '');

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
      authorId: author.id,
      metaTitle: parsedMetaTitle,
      metaDesc: parsedMetaDesc,
      geoTakeaway: geoTakeaway || null,
      faq,
      citations
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

  const metaTitle = formData.get('metaTitle') as string;
  const metaDesc = formData.get('metaDesc') as string;
  const geoTakeaway = formData.get('geoTakeaway') as string;
  
  const faqJson = formData.get('faqJson') as string;
  const citationsJson = formData.get('citationsJson') as string;

  const faq = faqJson ? JSON.parse(faqJson) : [];
  const citations = citationsJson ? JSON.parse(citationsJson) : [];

  const parsedMetaTitle = metaTitle || `${title} | James & Sons`;
  const parsedMetaDesc = metaDesc || excerpt || (content ? content.substring(0, 155).replace(/\r?\n|\r/g, " ") + '...' : '');

  await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      content,
      excerpt,
      isDraft,
      metaTitle: parsedMetaTitle,
      metaDesc: parsedMetaDesc,
      geoTakeaway: geoTakeaway || null,
      faq,
      citations
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
