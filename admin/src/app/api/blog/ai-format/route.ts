import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withErrorHandler } from "@/lib/api-handler";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { rawText, instruction } = await req.json();

  if (!rawText || typeof rawText !== "string") {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = `You are an expert blog editor and content formatter for James & Sons, a premium luxury lighting brand based in India.

Your job is to take raw blog content provided by the user and format it into clean, well-structured Markdown that is:
1. Properly formatted with headings (##, ###, ####), paragraphs, bullet lists, numbered lists, blockquotes, and horizontal rules where appropriate
2. Engaging and professional in tone, fitting a luxury lighting brand
3. SEO-friendly with proper heading hierarchy (H2 for major sections, H3 for subsections)
4. Well-paced with appropriate paragraph breaks
5. Tables should be formatted as proper GFM markdown tables when the content lends itself to tabular data

Rules:
- ONLY return the formatted markdown content, no preamble, no explanation
- Do NOT add a title (H1) unless one was clearly present in the original
- Preserve all factual information and product mentions from the original
- Use blockquotes (> text) for key takeaways or important callouts
- Use **bold** for important terms, *italic* for emphasis
- Keep inline HTML to an absolute minimum
- Preserve any existing shortcodes like [product:slug] or image markdown exactly as-is

${instruction ? `Additional instruction from author: ${instruction}` : ""}

Raw content to format:
---
${rawText}
---

Return only the formatted markdown:`;

  const result = await model.generateContent(systemPrompt);
  const formatted = result.response.text();

  return NextResponse.json({ formatted });
});
