"use client";

import React from "react";
import Link from "next/link";
import { BlogMarkdownRenderer } from "@james-andsons/blog-editor";
import type { Product } from "@/lib/utils";

interface BlogContentRendererProps {
  content: string;
  productsMap: Record<string, Product>;
  featuredImg?: string | null;
}

export default function BlogContentRenderer({
  content,
  productsMap,
  featuredImg,
}: BlogContentRendererProps) {
  return (
    <BlogMarkdownRenderer
      content={content}
      productsMap={productsMap as any}
      featuredImg={featuredImg}
      LinkComponent={Link as any}
    />
  );
}
