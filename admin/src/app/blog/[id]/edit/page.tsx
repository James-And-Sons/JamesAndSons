import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { updateBlogPost } from '../../actions';
import BlogFormClient from './BlogFormClient';

export const dynamic = 'force-dynamic';

interface EditBlogPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;

  const blogPostId = parseInt(id);

  const post = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
    include: { author: true }
  });

  if (!post) {
    notFound();
  }

  // Bind the updateBlogPost action with the ID
  const updatePostWithId = updateBlogPost.bind(null, blogPostId);

  return (
    <BlogFormClient post={post} action={updatePostWithId} />
  );
}
