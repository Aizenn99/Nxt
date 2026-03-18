"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserImages, deleteImage } from "@/app/store/image-slices/image-slice";

export default function ImageGallery() {
  const dispatch = useDispatch();
  const { images, loading, deleteLoading } = useSelector(
    (state) => state.image,
  );

  useEffect(() => {
    dispatch(fetchUserImages());
  }, [dispatch]);

  const handleDownload = (image) => {
    const link = document.createElement("a");
    link.href = image.imageUrl;
    link.download = `nxtai-${Date.now()}.jpg`;
    link.click();
  };

  const handleDelete = (imageId) => {
    dispatch(deleteImage(imageId));
  };

  if (loading && images.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!loading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-4xl mb-3">🖼️</p>
        <p className="text-sm">No images generated yet</p>
        <p className="text-xs mt-1 text-gray-600">
          Generate your first image above
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <div
          key={image._id}
          className="group relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900"
        >
          <img
            src={image.imageUrl}
            alt={image.prompt}
            className="w-full aspect-square object-cover"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
            <p className="text-white text-xs line-clamp-3 leading-relaxed">
              {image.prompt}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(image)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-1.5 rounded-lg transition"
              >
                ↓ Save
              </button>
              <button
                onClick={() => handleDelete(image._id)}
                disabled={deleteLoading === image._id}
                className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {deleteLoading === image._id ? "..." : "✕ Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
