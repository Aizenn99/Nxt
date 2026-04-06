// ─── Language Maps ────────────────────────────────────────────────────────────
const DEEPGRAM_TTS_MODEL_MAP = {
  en: "aura-asteria-en",
  es: "aura-asteria-es",
  fr: "aura-asteria-fr",
  de: "aura-asteria-de",
};

const LANGUAGE_NAME_TO_STT_CODE = {
  hindi: "hi",
  marathi: "mr",
  tamil: "ta",
  telugu: "te",
  gujarati: "gu",
  bengali: "bn",
  kannada: "kn",
  punjabi: "pa",
  english: "en",
  spanish: "es",
  french: "fr",
  german: "de",
  portuguese: "pt",
  japanese: "ja",
  korean: "ko",
  chinese: "zh",
};

// ─── Niche → Tone Map ─────────────────────────────────────────────────────────
const NICHE_TONE_MAP = {
  finance: "authoritative, data-driven, calm, trustworthy",
  fitness: "energetic, motivational, punchy, high-energy",
  education: "clear, patient, structured, informative",
  travel: "vivid, adventurous, descriptive, inspiring",
  food: "warm, sensory, inviting, enthusiastic",
  tech: "forward-thinking, precise, innovative, clear",
  health: "empathetic, reassuring, professional, caring",
  business: "confident, strategic, professional, results-driven",
  lifestyle: "relatable, aspirational, conversational, upbeat",
  motivation: "passionate, uplifting, urgent, empowering",
};

// ─── Background Music Map ─────────────────────────────────────────────────────
const NICHE_MUSIC_MAP = {
  finance: "music/corporate-background.mp3",
  fitness: "music/energetic-beat.mp3",
  education: "music/soft-ambient.mp3",
  travel: "music/adventure-cinematic.mp3",
  food: "music/warm-acoustic.mp3",
  tech: "music/digital-ambient.mp3",
  motivation: "music/epic-inspire.mp3",
};

// ─── Format Config ────────────────────────────────────────────────────────────
const FORMAT_CONFIG = {
  landscape: { width: 1344, height: 768, falSize: "landscape_16_9", ffmpegScale: "1344:768" },
  portrait: { width: 768, height: 1344, falSize: "portrait_4_3", ffmpegScale: "768:1344" },
  square: { width: 1080, height: 1080, falSize: "square_hd", ffmpegScale: "1080:1080" },
};

// ─── AI Model Config ─────────────────────────────────────────────────────────
const COHERE_MODELS = ["command-a-03-2025", "command-r-plus"];

module.exports = {
  DEEPGRAM_TTS_MODEL_MAP,
  LANGUAGE_NAME_TO_STT_CODE,
  NICHE_TONE_MAP,
  NICHE_MUSIC_MAP,
  FORMAT_CONFIG,
  COHERE_MODELS,
};
