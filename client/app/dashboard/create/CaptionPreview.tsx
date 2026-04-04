"use client";

import React from "react";

interface CaptionPreviewProps {
  styleId: string;
  text?: string;
  className?: string;
}

export const CaptionPreview: React.FC<CaptionPreviewProps> = ({ 
  styleId, 
  text = "NxtAi Captions", 
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-center h-full w-full bg-black/40 rounded-xl overflow-hidden p-4 ${className}`}>
      <style jsx>{`
        @keyframes karaoke {
          0%, 100% { color: #fff; }
          50% { color: #a855f7; text-shadow: 0 0 10px rgba(168, 85, 247, 0.5); }
        }
        @keyframes typewriter {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 5px #fff, 0 0 10px #fff; }
          50% { text-shadow: 0 0 20px #a855f7, 0 0 30px #a855f7; color: #d8b4fe; }
        }
        @keyframes impact {
          0% { transform: translate(0,0) scale(1.2); opacity: 0; }
          10% { transform: translate(-2px, -2px); opacity: 1; }
          20% { transform: translate(2px, 2px); }
          30% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          50% { transform: translate(0,0) scale(1); }
        }

        .karaoke { animation: karaoke 2s infinite; }
        .typewriter { 
          display: inline-block;
          overflow: hidden; 
          white-space: nowrap; 
          border-right: 2px solid #a855f7;
          animation: typewriter 2s steps(20) infinite alternate;
        }
        .pop { animation: popIn 1.5s infinite; }
        .slide { animation: slideUp 1.5s infinite; }
        .glow { animation: glowPulse 2s infinite; }
        .shake { animation: impact 2s infinite; }
      `}</style>

      <span className={`text-xl font-bold uppercase tracking-tighter ${styleId}`}>
        {text}
      </span>
    </div>
  );
};
