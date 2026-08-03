import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const isDraft = formData.get("isDraft") === "true";

    const metaTitle = formData.get("metaTitle") as string;
    const metaDesc = formData.get("metaDesc") as string;
    const geoTakeaway = formData.get("geoTakeaway") as string;
    const featuredImg = formData.get("featuredImg") as string | null;

    const faqJson = formData.get("faqJson") as string;
    const citationsJson = formData.get("citationsJson") as string;

    const faq = faqJson ? JSON.parse(faqJson) : [];
    const citations = citationsJson ? JSON.parse(citationsJson) : [];

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Missing required title, slug, or content fields." },
        { status: 400 },
      );
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    const authorId = adminUser
      ? adminUser.id
      : "e212a502-44b1-47c0-89b0-6fd369db03f4";

    const post = await prisma.blogPost.upsert({
      where: { slug },
      update: {
        title,
        excerpt,
        content,
        authorId,
        featuredImg,
        metaTitle: metaTitle || `${title} | James & Sons`,
        metaDesc: metaDesc || excerpt,
        geoTakeaway: geoTakeaway || null,
        faq,
        citations,
        isDraft,
        publishedAt: isDraft ? null : new Date(),
      },
      create: {
        slug,
        title,
        excerpt,
        content,
        authorId,
        featuredImg,
        metaTitle: metaTitle || `${title} | James & Sons`,
        metaDesc: metaDesc || excerpt,
        geoTakeaway: geoTakeaway || null,
        faq,
        citations,
        isDraft,
        publishedAt: isDraft ? null : new Date(),
      },
    });

    revalidatePath("/blog");
    revalidatePath("/(storefront)/blog", "layout");

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error: any) {
    console.error("Error saving blog post from import:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save blog post." },
      { status: 500 },
    );
  }
}
