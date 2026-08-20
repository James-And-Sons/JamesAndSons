"use client";

import BlogEditorForm from "@/components/blog/BlogEditorForm";
import { createBlogPost } from "../actions";
import { SimpleProduct } from "@/components/BlogProductPickerModal";

export default function NewBlogFormClient({
  products,
}: {
  products: SimpleProduct[];
}) {
  return (
    <BlogEditorForm
      mode="create"
      products={products}
      createAction={createBlogPost}
    />
  );
}
