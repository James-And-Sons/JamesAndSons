import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDocxToBlogPost, ParsedBlogPost } from "@/lib/docx-parser";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const saveImmediately = formData.get("saveImmediately") === "true";

    const allFiles: File[] = [];
    if (singleFile) allFiles.push(singleFile);
    if (files && files.length > 0) {
      for (const f of files) {
        if (!allFiles.includes(f)) allFiles.push(f);
      }
    }

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "No .docx file(s) uploaded." },
        { status: 400 },
      );
    }

    const parsedPosts: ParsedBlogPost[] = [];
    const savedPosts = [];

    // Find admin user for author assignment
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    const authorId = adminUser
      ? adminUser.id
      : "e212a502-44b1-47c0-89b0-6fd369db03f4";

    for (const file of allFiles) {
      if (!file.name.endsWith(".docx")) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await parseDocxToBlogPost(buffer);

      parsedPosts.push(parsed);

      if (saveImmediately) {
        const post = await prisma.blogPost.upsert({
          where: { slug: parsed.slug },
          update: {
            title: parsed.title,
            excerpt: parsed.excerpt,
            content: parsed.content,
            authorId,
            featuredImg: parsed.featuredImg,
            metaTitle: parsed.metaTitle,
            metaDesc: parsed.metaDesc,
            geoTakeaway: parsed.geoTakeaway,
            faq: parsed.faq as any,
            citations: parsed.citations as any,
            isDraft: parsed.isDraft,
            publishedAt: parsed.isDraft ? null : new Date(),
          },
          create: {
            slug: parsed.slug,
            title: parsed.title,
            excerpt: parsed.excerpt,
            content: parsed.content,
            authorId,
            featuredImg: parsed.featuredImg,
            metaTitle: parsed.metaTitle,
            metaDesc: parsed.metaDesc,
            geoTakeaway: parsed.geoTakeaway,
            faq: parsed.faq as any,
            citations: parsed.citations as any,
            isDraft: parsed.isDraft,
            publishedAt: parsed.isDraft ? null : new Date(),
          },
        });
        savedPosts.push(post);
      }
    }

    return NextResponse.json({
      success: true,
      count: parsedPosts.length,
      posts: parsedPosts,
      savedPosts: saveImmediately ? savedPosts : [],
    });
  } catch (error: any) {
    console.error("Error in /api/blog/import-docx:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse DOCX file(s)." },
      { status: 500 },
    );
  }
}
