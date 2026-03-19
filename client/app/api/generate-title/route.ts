import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ title: "New Chat" });
    }

    const apiKey = process.env.GROQ_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ title: message.slice(0, 40) });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Generate a short, concise chat title (max 5 words) for the following user message. 
              Rules:
              - Maximum 5 words
              - No quotes, no punctuation at the end
              - Title case
              - Capture the essence of what the user wants
              - Examples: "React Login Component Code", "Fix Python Bug", "Marketing Plan Ideas", "Generate Google Logo"
              - Return ONLY the title, nothing else`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.3,
          max_tokens: 20,
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ title: message.slice(0, 40) });
    }

    const data = await response.json();
    const title =
      data.choices?.[0]?.message?.content?.trim() || message.slice(0, 40);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    return NextResponse.json({ title: "New Chat" });
  }
}
