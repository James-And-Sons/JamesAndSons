import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment." },
        { status: 500 },
      );
    }

    const { prompt, tone = "luxury", target = "both" } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt description is required to generate push copy." },
        { status: 400 },
      );
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are an elite marketing copywriter for "James & Sons" (jamesandsons.in), an ultra-luxury bespoke lighting and chandelier brand.
Generate a push notification title and message body for the following request: "${prompt}".
Tone style: ${tone} (Options: luxury concierge, urgent flash sale, new drop announcement, festive celebration).

STRICT CONSTRAINTS (CRITICAL FOR LOCKSCREEN DISPLAY):
1. "title": Maximum 50 characters including emojis. Must be engaging and concise.
2. "body": Maximum 120 characters including emojis. High urgency / high curiosity.

Respond ONLY with a raw JSON object matching this schema:
{
  "title": "string (max 50 chars)",
  "body": "string (max 120 chars)"
}`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response.");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Truncate to enforce strict character limits
    const title = (parsed.title || "").slice(0, 50);
    const body = (parsed.body || "").slice(0, 120);

    return NextResponse.json({
      success: true,
      title,
      body,
    });
  } catch (error: any) {
    console.error("[Push AI Copy Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI push copy." },
      { status: 500 },
    );
  }
}
