"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { generateImage, clearError } from "@/app/store/image-slices/image-slice";

const SIZES = [
  { label: "512 × 512", width: 512, height: 512 },
  { label: "768 × 512", width: 768, height: 512 },
  { label: "512 × 768", width: 512, height: 768 },
  { label: "1024 × 1024", width: 1024, height: 1024 },
];

export default function ImageGenerator() {
  const dispatch = useDispatch();
  const { loading, currentImage, error, creditsRemaining } = useSelector(
    (state) => state.image,
  );

  const [prompt, setPrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);

  const handleGenerate = () => {
    if (!prompt.trim() || loading) return;
    dispatch(clearError());
    dispatch(
      generateImage({
        prompt: prompt.trim(),
        width: selectedSize.width,
        height: selectedSize.height,
      }),
    );
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement("a");
    link.href = currentImage.imageUrl;
    link.download = `nxtai-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Your Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A futuristic city at sunset with neon lights..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-purple-500 transition"
        />
      </div>

      {/* Size Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Image Size</label>
        <div className="flex gap-2 flex-wrap">
          {SIZES.map((size) => (
            <button
              key={size.label}
              onClick={() => setSelectedSize(size)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                selectedSize.label === size.label
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Credits Info */}
      {creditsRemaining !== null && (
        <p className="text-xs text-gray-500">
          Credits remaining:{" "}
          <span className="text-purple-400 font-medium">
            {creditsRemaining}
          </span>
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating... (may take 10–20s)
          </>
        ) : (
          "✦ Generate Image"
        )}
      </button>

      {/* Generated Image Preview */}
      {currentImage && (
        <div className="flex flex-col gap-3">
          <img
            src={currentImage.imageUrl}
            alt={currentImage.prompt}
            className="w-full rounded-2xl border border-gray-700 object-cover"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-xl transition border border-gray-700"
            >
              ↓ Download
            </button>
            <button
              onClick={() => setPrompt(currentImage.prompt)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm py-2 rounded-xl transition border border-gray-700"
            >
              ↺ Reuse Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
