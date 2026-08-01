"use client";

/**
 * Admin-side wrapper around the @james-andsons/blog-editor package renderer.
 * This keeps the component "use client" and re-exports it for use in the admin
 * preview and any other consumer within the admin app.
 */
export {
  BlogMarkdownRenderer as default,
  BlogMarkdownRenderer,
} from "@james-andsons/blog-editor";
export type { SimpleProduct } from "@james-andsons/blog-editor";
