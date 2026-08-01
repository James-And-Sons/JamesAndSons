"use client";

import BlogEditorForm from "@/components/blog/BlogEditorForm";
import { SimpleProduct } from "@/components/BlogProductPickerModal";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImg: string | null;
  isDraft: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
  geoTakeaway: string | null;
  faq: any;
  citations: any;
}

interface BlogFormClientProps {
  post: BlogPost;
  products: SimpleProduct[];
  action: (formData: FormData) => Promise<void>;
}

export default function BlogFormClient({
  post,
  products,
  action,
}: BlogFormClientProps) {
  return (
    <BlogEditorForm
      mode="edit"
      post={post}
      products={products}
      action={action}
    />
  );
}
