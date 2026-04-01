import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const hfKey = process.env.HF_API || "";
    if (!hfKey) {
      return NextResponse.json(
        { error: "HF_API key not configured" },
        { status: 500 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    // Call Hugging Face API to transcribe with retry logic for "Model Loading"
    const maxRetries = 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      const hfRes = await fetch(
        "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": file.type || "audio/webm",
          },
          body: arrayBuffer, // ArrayBuffer is stable in Node fetch (undici), Blob streams can cause 'terminated' errors
        },
      );

      if (!hfRes.ok) {
        const errText = await hfRes.text();
        
        // If model is loading, wait and retry
        if (hfRes.status === 503 && errText.includes("currently loading")) {
          console.log(`[STT] Model loading. Retrying... (${attempts + 1}/${maxRetries})`);
          attempts++;
          await new Promise(r => setTimeout(r, 10000)); // wait 10 seconds before retry
          continue;
        }

        console.error("❌ STT error:", hfRes.status, errText);
        return NextResponse.json(
          { error: `Transcription failed: ${hfRes.statusText}`, details: errText },
          { status: hfRes.status },
        );
      }

      const data = await hfRes.json();
      return NextResponse.json({ text: data.text });
    }
    
    return NextResponse.json({ error: "Model didn't load in time. Please try again." }, { status: 503 });
  } catch (error: any) {
    console.error("❌ /api/transcribe error:", error.message);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
