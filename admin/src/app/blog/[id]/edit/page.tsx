import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateBlogPost } from "../../actions";
import BlogFormClient from "./BlogFormClient";

export const dynamic = "force-dynamic";

interface EditBlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  const { id } = await params;

  const blogPostId = parseInt(id);

  const [post, products] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: { author: true },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        category: { select: { name: true } },
        d2cPrice: true,
        images: true,
        whiteBackgroundImages: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!post) {
    notFound();
  }

  // Bind the updateBlogPost action with the ID
  const updatePostWithId = updateBlogPost.bind(null, blogPostId);

  const formattedProducts = products.map((p) => ({
    ...p,
    collection: p.category?.name || "Catalog Item",
  }));

  return (
    <BlogFormClient
      post={post}
      products={formattedProducts}
      action={updatePostWithId}
    />
  );
}
