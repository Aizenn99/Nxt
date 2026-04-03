import { NextRequest, NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";

export async function POST(req: NextRequest) {
  try {
    const { messages, model, chatTitle } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token" },
        { status: 401 },
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const lastMessage = messages[messages.length - 1];
    const userMessageContent = lastMessage.content as string;

    // ─────────────────────────────────────────
    // /image prefix — generate image in chat
    // ─────────────────────────────────────────
    if (userMessageContent.startsWith("/image ")) {
      const prompt = userMessageContent.replace("/image ", "").trim();

      // Deduct credits first for image
      const deductRes = await fetch(`${backendUrl}/api/auth/deduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${token}`,
        },
        body: JSON.stringify({ feature: "image" }),
      });

      if (!deductRes.ok) {
        const errData = await deductRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData.message || "Insufficient credits" },
          { status: deductRes.status },
        );
      }

      const { remainingCredits } = await deductRes.json();

      const hfKey = process.env.HF_API || "";
      if (!hfKey) {
        return NextResponse.json(
          { error: "HF_API key not configured" },
          { status: 500 },
        );
      }

      // Call Hugging Face FLUX
      const hfRes = await fetch(
        "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
            Accept: "image/jpeg",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { width: 512, height: 512 },
          }),
        },
      );

      if (!hfRes.ok) {
        const errText = await hfRes.text();
        console.error("❌ HF image error:", hfRes.status, errText);

        if (hfRes.status === 503) {
          return NextResponse.json(
            { error: "Image model is loading, please retry in 20 seconds" },
            { status: 503 },
          );
        }
        if (hfRes.status === 401) {
          return NextResponse.json(
            { error: "Invalid Hugging Face token" },
            { status: 401 },
          );
        }
        return NextResponse.json(
          { error: "Image generation failed" },
          { status: 500 },
        );
      }

      const buffer = await hfRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const imageUrl = `data:image/jpeg;base64,${base64}`;

      // ✅ Save image to MongoDB so it persists after refresh
      let imageId: string | null = null;
      try {
        const saveRes = await fetch(`${backendUrl}/api/images/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `token=${token}`,
          },
          body: JSON.stringify({
            prompt,
            imageUrl,
            width: 512,
            height: 512,
          }),
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          imageId = saveData.image._id;
          console.log("✅ Image saved to MongoDB:", imageId);
        } else {
          console.error("❌ Failed to save image:", await saveRes.text());
        }
      } catch (e) {
        console.error("❌ Image save error:", e);
      }

      // ✅ Use [image:ID:prompt] format so it can reload from DB on refresh
      // Falls back to base64 if save failed
      // ✅ Use ||| as separator — avoids conflicts with colons in prompts
      const reply = imageId
        ? `[image|||${imageId}|||${prompt}]`
        : `![${prompt}](${imageUrl})`;

      return NextResponse.json({
        reply,
        remainingCredits,
        type: "image",
      });
    }

    // ─────────────────────────────────────────
    // /video prefix — generate video in chat
    // ─────────────────────────────────────────
    if (userMessageContent.startsWith("/video ")) {
      const prompt = userMessageContent.replace("/video ", "").trim();

      const deductRes = await fetch(`${backendUrl}/api/auth/deduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${token}`,
        },
        body: JSON.stringify({ feature: "video" }),
      });

      if (!deductRes.ok) {
        const errData = await deductRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData.message || "Insufficient credits" },
          { status: deductRes.status },
        );
      }

      const { remainingCredits } = await deductRes.json();

      const hfKey = process.env.HF_API || "";
      if (!hfKey) {
        return NextResponse.json(
          { error: "HF_API key not configured" },
          { status: 500 },
        );
      }

      // ── fal.ai — Wan2.1 T2V Turbo (free tier available) ────────────
      // Sign up at fal.ai for a free API key. No credit card required for free tier.
      const falKey = process.env.FAL_AI || "";
      if (!falKey) {
        return NextResponse.json(
          { error: "FAL_AI key not configured" },
          { status: 500 },
        );
      }

      const falRes = await fetch(
        "https://fal.run/fal-ai/wan/v2.1/text-to-video",
        {
          method: "POST",
          headers: {
            Authorization: `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            negative_prompt: "low quality, blurry, distorted, watermark",
            num_inference_steps: 30,
            guidance_scale: 5.0,
          }),
        },
      );

      if (!falRes.ok) {
        const errText = await falRes.text();
        console.error("❌ fal.ai video error:", falRes.status, errText);
        return NextResponse.json(
          { error: `Video generation failed: ${errText}` },
          { status: 500 },
        );
      }

      const falData = await falRes.json();
      const videoUrl = falData?.video?.url ?? falData?.url ?? "";
      if (!videoUrl) {
        console.error("❌ No video URL in fal response:", falData);
        return NextResponse.json(
          { error: "Video generation failed: no URL returned" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        reply: `![video:${prompt}](${videoUrl})`,
        remainingCredits,
        type: "video",
      });
    }

    // ─────────────────────────────────────────
    // /pdf prefix — generate PDF document
    // ─────────────────────────────────────────
    if (
      userMessageContent === "/pdf" ||
      userMessageContent.startsWith("/pdf ")
    ) {
      const customTopic = userMessageContent.replace("/pdf", "").trim();
      const topic = customTopic || chatTitle || "Chat Document";

      const deductRes = await fetch(`${backendUrl}/api/auth/deduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${token}`,
        },
        body: JSON.stringify({ feature: "chat" }),
      });

      const { remainingCredits } = await deductRes
        .json()
        .catch(() => ({ remainingCredits: null }));

      const pdfRes = await fetch(`${req.nextUrl.origin}/api/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${token}`,
        },
        body: JSON.stringify({ topic, messages }),
      });

      if (!pdfRes.ok) {
        return NextResponse.json(
          { error: "PDF generation failed" },
          { status: 500 },
        );
      }

      const pdfBuffer = await pdfRes.arrayBuffer();
      const base64 = Buffer.from(pdfBuffer).toString("base64");

      return NextResponse.json({
        reply: `[pdf-ready|||${base64}|||${topic}]`,
        remainingCredits,
        type: "pdf",
      });
    }

    // ─────────────────────────────────────────
    // Pre-process Messages (Handle Attachments)
    // ─────────────────────────────────────────
    const selectedModel = model || "llama-3.3-70b-versatile";
    
    // Convert base64 text files back to raw strings for all models to read seamlessly
    const parsedMessages = messages.map((m: any) => {
      let text = m.content || "";
      const cleanedAttachments: any[] = [];
      
      if (m.attachments && Array.isArray(m.attachments)) {
        m.attachments.forEach((att: any) => {
          if (!att.base64) return;
          const isText = att.type.startsWith("text/") || 
                         att.type === "application/json" || 
                         /\.(md|txt|js|jsx|ts|tsx|py|csv|json)$/.test(att.name.toLowerCase());
                         
          if (isText) {
            try {
              const base64Data = att.base64.split(',')[1] || att.base64;
              const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
              text += `\n\n[File Content: ${att.name}]\n${decodedText}\n`;
            } catch(e) { /* ignore parse error */ }
          } else {
            cleanedAttachments.push(att); // Push non-text (Image/PDF) for Vision processing
          }
        });
      }
      
      return { ...m, content: text, attachments: cleanedAttachments };
    });

    let reply = "";

    if (selectedModel === "cohere") {
      const apiKey = process.env.COHERE_API || "";
      if (!apiKey) {
        return NextResponse.json(
          { error: "Cohere API key not configured" },
          { status: 500 },
        );
      }

      const cohere = new CohereClientV2({ token: apiKey });

      const cohereMessages = [
        { role: "system", content: "You are NxtAI. Be concise." },
        ...parsedMessages.map((m: any) => {
          let finalContent = m.content;
          if (m.attachments.length > 0) {
            const blocked = m.attachments.map((a: any)=>a.name).join(", ");
            finalContent += `\n\n[System Note: User attached media files: ${blocked}. This model cannot process images/complex media. Please inform the user gracefully.]`;
          }
          return { role: m.role === "assistant" ? "assistant" : "user", content: finalContent };
        }),
      ];

      const response = await cohere.chat({
        model: "command-a-03-2025",
        messages: cohereMessages as any,
      });

      const textContent = (response.message?.content as any)?.[0]?.text;
      reply = textContent || String(response.message?.content || "");
    } else {
      let apiUrl = "";
      let apiKey = "";
      let requestBody: any = {};
      let headers: any = { "Content-Type": "application/json" };

      if (selectedModel === "llama-3.3-70b-versatile") {
        apiKey = process.env.GROQ_API_KEY || "";
        apiUrl = "https://api.groq.com/openai/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        
        requestBody = {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are NxtAI. Be concise and helpful." },
            ...parsedMessages.map((m: any) => {
              let finalContent = m.content;
              if (m.attachments.length > 0) {
                const blocked = m.attachments.map((a: any)=>a.name).join(", ");
                finalContent += `\n\n[System Note: User attached media files: ${blocked}. The vision/binary data was dropped because this model does not support image analysis.]`;
              }
              return { role: m.role, content: finalContent };
            }),
          ],
          temperature: 0.7,
          max_tokens: 1024,
        };

      } else if (selectedModel === "gemini") {
        apiKey = process.env.GEMINI_API || "";
        // ✅ Native Google API handles attachments perfectly using inlineData
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        delete headers["Authorization"]; // Key is strictly in URL params
        
        const geminiContents = parsedMessages.map((m: any) => {
          const parts: any[] = [{ text: m.content }];
          
          m.attachments.forEach((att: any) => {
             const base64Data = att.base64.split(',')[1] || att.base64;
             parts.push({
               inlineData: {
                 mimeType: att.type || "application/octet-stream",
                 data: base64Data
               }
             });
          });
          
          return {
            role: m.role === "assistant" ? "model" : "user",
            parts
          };
        });

        requestBody = {
          systemInstruction: {
            role: "system",
            parts: [{ text: "You are NxtAI. Be concise." }]
          },
          contents: geminiContents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        };

      } else if (selectedModel === "deepseek") {
        apiKey = process.env.DEEP_SEEK_API || "";
        apiUrl = "https://api.deepseek.com/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        requestBody = {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "You are NxtAI. Be concise." },
            ...parsedMessages.map((m: any) => {
              let finalContent = m.content;
              if (m.attachments.length > 0) {
                const blocked = m.attachments.map((a: any)=>a.name).join(", ");
                finalContent += `\n\n[System Note: User attached media files: ${blocked}. The vision/binary data was dropped because this model does not support image analysis.]`;
              }
              return { role: m.role, content: finalContent };
            }),
          ],
        };
      } else {
        return NextResponse.json(
          { error: "Unsupported model" },
          { status: 400 },
        );
      }

      if (!apiKey) {
        return NextResponse.json(
          { error: `API key for ${selectedModel} is not configured` },
          { status: 500 },
        );
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: req.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error(`❌ ${selectedModel} error:`, err);
        return NextResponse.json(
          { error: err.error?.message || `${selectedModel} request failed` },
          { status: response.status },
        );
      }

      const data = await response.json();
      
      // Handle native Gemini reply structure OR standard OpenAI choice structure
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text 
              || data.choices?.[0]?.message?.content 
              || "";
    }

    // Deduct credits AFTER successful AI response
    const deductRes = await fetch(`${backendUrl}/api/auth/deduct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ feature: "chat" }),
    });

    const { remainingCredits } = await deductRes
      .json()
      .catch(() => ({ remainingCredits: null }));

    return NextResponse.json({ reply, remainingCredits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ /api/chat fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}