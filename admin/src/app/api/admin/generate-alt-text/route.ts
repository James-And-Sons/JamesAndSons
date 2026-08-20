import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const { dataUrl } = await req.json();
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image data." },
        { status: 400 },
      );
    }

    // Extract base64 payload and MIME type from the data URL
    const [header, base64Data] = dataUrl.split(",");
    const mimeType = header.split(";")[0].split(":")[1] as
      "image/jpeg" | "image/png" | "image/webp";

    const ai = new GoogleGenerativeAI(apiKey);
    const modelCandidates = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ];

    let altText = "";
    let lastError: unknown = null;

    for (const modelName of modelCandidates) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: { mimeType, data: base64Data },
                },
                {
                  text: [
                    "You are an SEO and accessibility specialist for 'James & Sons' — a luxury bespoke",
                    "home decor and lighting brand based in India.",
                    "Analyse this product image and write a concise, descriptive alt text string.",
                    "Rules:",
                    "- Maximum 125 characters (count carefully).",
                    "- Describe the visual contents of the image: product type, material, colour, style.",
                    "- Use natural language; do NOT start with 'Image of' or 'Photo of'.",
                    "- Include relevant keywords naturally (e.g. 'handcrafted brass pendant light').",
                    "- Do NOT use quotes, markdown, or any explanation — return the alt text ONLY.",
                  ].join(" "),
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.4, maxOutputTokens: 80 },
        });
        altText = result.response
          .text()
          .trim()
          .replace(/^["']|["']$/g, "");
        if (altText) break;
      } catch (err) {
        console.warn(`[Alt Text] Model ${modelName} failed:`, err);
        lastError = err;
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (!altText) {
      throw lastError || new Error("All model candidates failed.");
    }

    return NextResponse.json({ altText });
  } catch (err: unknown) {
    console.error("[Alt Text API] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate alt text." },
      { status: 500 },
    );
  }
}
