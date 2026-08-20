import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Auto-load environment variables from admin/.env.local before importing @james-andsons/db
const envPath = path.resolve(__dirname, "../admin/.env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import {
  parseDocxToBlogPost,
  ParsedBlogPost,
} from "../admin/src/lib/docx-parser";

const DEFAULT_AUTHOR_ID = "e212a502-44b1-47c0-89b0-6fd369db03f4";

async function main() {
  // Dynamically import prisma AFTER environment variables are populated
  const { prisma } = await import("@james-andsons/db");

  const args = process.argv.slice(2);
  const targetPath = args[0];

  let postsToPublish: ParsedBlogPost[] = [];

  let authorId = DEFAULT_AUTHOR_ID;
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (adminUser) {
      authorId = adminUser.id;
    }
  } catch (err) {
    console.warn(
      "⚠️ Could not query admin user from DB, using fallback author ID.",
    );
  }

  if (targetPath && fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isFile() && targetPath.endsWith(".docx")) {
      console.log(`📄 Parsing single DOCX file: ${targetPath}`);
      const buffer = fs.readFileSync(targetPath);
      const parsed = await parseDocxToBlogPost(buffer);
      postsToPublish.push(parsed);
    } else if (stat.isDirectory()) {
      console.log(`📁 Scanning directory for .docx files: ${targetPath}`);
      const files = fs
        .readdirSync(targetPath)
        .filter((f) => f.endsWith(".docx"));
      for (const file of files) {
        const filePath = path.join(targetPath, file);
        console.log(`  └─ Parsing ${file}...`);
        const buffer = fs.readFileSync(filePath);
        const parsed = await parseDocxToBlogPost(buffer);
        postsToPublish.push(parsed);
      }
    }
  } else {
    const docxDir = path.join(__dirname, "docx_blogs");
    if (fs.existsSync(docxDir)) {
      const files = fs.readdirSync(docxDir).filter((f) => f.endsWith(".docx"));
      for (const file of files) {
        const filePath = path.join(docxDir, file);
        console.log(`📄 Found DOCX manuscript: ${file}`);
        const buffer = fs.readFileSync(filePath);
        const parsed = await parseDocxToBlogPost(buffer);
        postsToPublish.push(parsed);
      }
    }
  }

  if (postsToPublish.length === 0) {
    console.log(
      "ℹ️ No external .docx files provided. Executing built-in editorial dataset...",
    );
    postsToPublish = getBuiltInManuscripts();
  }

  console.log(
    `\n🚀 Publishing ${postsToPublish.length} blog post(s) into database...`,
  );

  for (const b of postsToPublish) {
    const post = await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        excerpt: b.excerpt,
        content: b.content,
        authorId,
        featuredImg: b.featuredImg,
        metaTitle: b.metaTitle,
        metaDesc: b.metaDesc,
        geoTakeaway: b.geoTakeaway,
        faq: b.faq as any,
        citations: b.citations as any,
        isDraft: b.isDraft,
        publishedAt: b.isDraft ? null : new Date(),
      },
      create: {
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt,
        content: b.content,
        authorId,
        featuredImg: b.featuredImg,
        metaTitle: b.metaTitle,
        metaDesc: b.metaDesc,
        geoTakeaway: b.geoTakeaway,
        faq: b.faq as any,
        citations: b.citations as any,
        isDraft: b.isDraft,
        publishedAt: b.isDraft ? null : new Date(),
      },
    });

    console.log(
      `✅ [${post.isDraft ? "DRAFT" : "PUBLISHED"}] "${post.title}" (ID: ${post.id}, Slug: /${post.slug})`,
    );
  }

  console.log("\n🎉 DOCX Importer Execution Completed Successfully!\n");
  await prisma.$disconnect();
}

function getBuiltInManuscripts(): ParsedBlogPost[] {
  return [
    {
      slug: "how-to-choose-the-perfect-chandelier-for-every-room",
      title: "How to Choose the Perfect Chandelier for Every Room",
      metaTitle:
        "How to Choose the Perfect Chandelier for Every Room | James & Sons",
      metaDesc:
        "Confused about which chandelier suits your living room, bedroom, or dining area? James & Sons walks you through choosing the perfect chandelier by room, style, and size. Shop at jamesandsons.in",
      excerpt:
        "A practical room-by-room guide to choosing the ideal chandelier size, style, and finish for living rooms, bedrooms, dining areas, and foyers across India.",
      featuredImg:
        "https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png",
      geoTakeaway:
        "In Indian homes, ceiling heights and architectural layouts vary significantly. Choose a 12-light chandelier for living rooms above 300 sq ft, 8-light for dining tables, and 6-light warm fixtures for bedrooms to ensure balanced proportion and illumination.",
      content: `A chandelier is not just a light fixture — it is a statement. It is the first thing guests notice when they walk into a room, and the last thing they remember when they leave. But with so many shapes, sizes, finishes, and light counts available, how do you choose the right one?\n\nAt James & Sons, we have helped hundreds of homeowners and interior designers across India find their perfect chandelier. In this guide, we break it down room by room — so you can shop with confidence.\n\n---\n\n### 1. Chandeliers for the Living Room\n\nThe living room is your home's showpiece, and your chandelier should reflect that. For large living rooms with high ceilings, go for statement pieces — 12-light chandeliers in gold, black iron, or crystal finishes make a dramatic impression.\n\n#### Popular Choices from Our Collection:\n\n![JC7 12-Light Black Iron Classic Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1783333308/PHOTO-2026-03-25-12-16-15_htpxjb.jpg#product:12-light-black-chandelier-jc03)\n\n[product:12-light-black-chandelier-jc03]\n\n* **Chandelier JC7 — 12-Light Black Iron Classic**: Bold, dramatic, perfect for modern and industrial interiors.\n* **Chandelier JC9 — 8/12-Light Gold & Crystal**: Timeless luxury for traditional or opulent living rooms.\n\n[product:8-light-chandelier]\n\n* **Chandelier JC6 — 6/12-Light Gold**: Warm, regal, and ideal for large drawing rooms.\n\n[product:6-light-black-modern-chandelier-jc07]\n\n> **Rule of Thumb:** Add the length and width of your room in feet — that number in inches is the ideal chandelier diameter.`,
      faq: [
        {
          q: "How high should a chandelier hang in a dining room?",
          a: "A dining room chandelier should be positioned 30 to 36 inches above the dining table surface for optimal illumination without obstructing sightlines.",
        },
        {
          q: "What size chandelier do I need for a 14x14 ft room?",
          a: "Add 14 + 14 = 28. A chandelier with a diameter of around 28 inches (typically an 8-light model) is ideal.",
        },
      ],
      citations: [
        {
          label: "James & Sons Luxury Chandelier Collection",
          url: "https://jamesandsons.in/collections",
        },
      ],
      isDraft: false,
    },
    {
      slug: "top-chandelier-trends-in-india-2025",
      title: "Top Chandelier Trends in India for 2025",
      metaTitle: "Top Chandelier Trends in India for 2025 | James & Sons",
      metaDesc:
        "What is trending in chandelier design for 2025? From antique gold to open-frame black, discover the hottest chandelier styles taking over Indian homes. Shop at jamesandsons.in.",
      excerpt:
        "Discover the top 5 chandelier trends dominating luxury Indian home interiors in 2025, featuring antique gold finishes, black iron industrial elegance, and crystal accents.",
      featuredImg:
        "https://res.cloudinary.com/dy1durdrj/image/upload/v1785532952/fdc39021-e93e-4d71-b305-d6c78bf34763_jn3bzn.png",
      geoTakeaway:
        "2025 lighting trends in India heavily favor warm antique gold finishes and dual-tone black-and-gold fixtures. Architects and luxury interior designers prefer warm LED color temperatures (2700K–3000K) to complement Indian marble and teak wood interiors.",
      content: `Indian homes are evolving. Today's homeowners want lighting that does more than illuminate — they want it to tell a story. Chandeliers have become central to that narrative, blending tradition with contemporary design in bold, unexpected ways.\n\nHere are the biggest chandelier trends shaping Indian interiors in 2025 — and how you can bring them home with James & Sons.\n\n---\n\n### Trend 1: Antique Gold is Back — Bigger Than Ever\n\nGold never truly goes out of style, but in 2025, it is having a serious renaissance. Antique gold finishes — warm, slightly distressed, and deeply luxurious — are replacing the cooler chrome and nickel tones of the last decade.`,
      faq: [
        {
          q: "Are gold chandeliers trending in 2025?",
          a: "Yes! Warm antique gold and brass finishes are leading 2025 interior trends across luxury homes and boutique hospitality.",
        },
      ],
      citations: [
        {
          label: "James & Sons 2025 Trend Catalogue",
          url: "https://jamesandsons.in/collections",
        },
      ],
      isDraft: false,
    },
  ];
}

main().catch((err) => {
  console.error("❌ Error running publish_docx_blogs script:", err);
  process.exit(1);
});
