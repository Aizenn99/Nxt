import ImageGenerator from "@/components/image/ImageGenerator";
import ImageGallery from "@/components/image/ImageGallery";

export default function ImagePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-white">
            Image Generation
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Turn your words into stunning AI images — 5 credits per image
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left — Generator */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-5">Generate</h2>
            <ImageGenerator />
          </div>

          {/* Right — Gallery */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-5">
              Your Gallery
            </h2>
            <ImageGallery />
          </div>
        </div>
      </div>
    </div>
  );
}
