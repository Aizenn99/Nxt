// ─── Language Options ────────────────────────────────────────────────────────

export interface LanguageOption {
  language: string;
  countryCode: string;
  countryFlag: string;
  modelName: "Fonadalab" | "Deepgram";
  modelLanguageCode: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { language: "Hindi",          countryCode: "IN", countryFlag: "🇮🇳", modelName: "Fonadalab", modelLanguageCode: "hi-IN" },
  { language: "Marathi",        countryCode: "IN", countryFlag: "🇮🇳", modelName: "Fonadalab", modelLanguageCode: "mr-IN" },
  { language: "Tamil",          countryCode: "IN", countryFlag: "🇮🇳", modelName: "Fonadalab", modelLanguageCode: "ta-IN" },
  { language: "Telugu",         countryCode: "IN", countryFlag: "🇮🇳", modelName: "Fonadalab", modelLanguageCode: "te-IN" },
  { language: "English (India)",countryCode: "IN", countryFlag: "🇮🇳", modelName: "Deepgram",  modelLanguageCode: "en-IN" },
  { language: "English (US)",   countryCode: "US", countryFlag: "🇺🇸", modelName: "Deepgram",  modelLanguageCode: "en-US" },
  { language: "English (UK)",   countryCode: "GB", countryFlag: "🇬🇧", modelName: "Deepgram",  modelLanguageCode: "en-GB" },
  { language: "Spanish",        countryCode: "ES", countryFlag: "🇪🇸", modelName: "Deepgram",  modelLanguageCode: "es-ES" },
  { language: "French",         countryCode: "FR", countryFlag: "🇫🇷", modelName: "Deepgram",  modelLanguageCode: "fr-FR" },
  { language: "German",         countryCode: "DE", countryFlag: "🇩🇪", modelName: "Deepgram",  modelLanguageCode: "de-DE" },
];

// ─── Voice Models ─────────────────────────────────────────────────────────────

export type VoiceGender = "male" | "female";

export interface VoiceModel {
  model: string;
  modelName: string;
  /** Path relative to /public — e.g. "voice/fonadalab-Vaanee.mp3.mpeg" */
  preview: string;
  gender: VoiceGender;
}

export const VOICE_MODELS: Record<"Fonadalab" | "Deepgram", VoiceModel[]> = {
  Fonadalab: [
    { model: "fonadalab", modelName: "Vaanee",  preview: "voice/fonadalab-Vaanee.mp3.mpeg",  gender: "female" },
    { model: "fonadalab", modelName: "Chaitra", preview: "voice/fonadalab-Chaitra.mp3.mpeg", gender: "female" },
    { model: "fonadalab", modelName: "Meghra",  preview: "voice/fonadalab-Meghra.mp3.mpeg",  gender: "female" },
    { model: "fonadalab", modelName: "Nirvani", preview: "voice/fonadalab-Nirvani.mp3.mpeg", gender: "female" },
  ],
  Deepgram: [
    { model: "deepgram", modelName: "aura-2-amalthea-en",  preview: "voice/deepgram-aura-2-amalthea-en.wav",  gender: "female" },
    { model: "deepgram", modelName: "aura-2-andromeda-en", preview: "voice/deepgram-aura-2-andromeda-en.wav", gender: "female" },
    { model: "deepgram", modelName: "aura-2-thalia-en",    preview: "voice/deepgram-aura-2-thalia-en.wav",    gender: "female" },
    { model: "deepgram", modelName: "aura-2-apollo-en",    preview: "voice/deepgram-aura-2-apollo-en.wav",    gender: "male"   },
    { model: "deepgram", modelName: "aura-2-odysseus-en",  preview: "voice/deepgram-aura-2-odysseus-en.wav",  gender: "male"   },
  ],
};

// ─── Background Music Tracks ─────────────────────────────────────────────────

export type MusicMood = "epic" | "hype" | "chill" | "trending" | "marketing";

export interface BgMusicTrack {
  id: string;
  title: string;
  mood: MusicMood;
  /** Emoji tag for the mood */
  moodEmoji: string;
  /** Remote URL served via ImageKit CDN */
  url: string;
}

export const BG_MUSIC_TRACKS: BgMusicTrack[] = [
  {
    id: "dramatic-hip-hop",
    title: "Dramatic Hip Hop",
    mood: "epic",
    moodEmoji: "🎭",
    url: "https://ik.imagekit.io/Tubeguruji/BgMusic/dramatic-hip-hop-music-background-jazz-music-for-short-video-148505.mp3",
  },
  {
    id: "basketball-reels",
    title: "Basketball Reels",
    mood: "hype",
    moodEmoji: "🏀",
    url: "https://ik.imagekit.io/Tubeguruji/BgMusic/basketball-instagram-reels-music-461852.mp3",
  },
  {
    id: "marketing-reels-1",
    title: "Marketing Reels Vol.1",
    mood: "marketing",
    moodEmoji: "📣",
    url: "https://ik.imagekit.io/Tubeguruji/BgMusic/instagram-reels-marketing-music-384448.mp3",
  },
  {
    id: "trending-reels",
    title: "Trending Reels",
    mood: "trending",
    moodEmoji: "🔥",
    url: "https://ik.imagekit.io/Tubeguruji/BgMusic/trending-instagram-reels-music-447249.mp3",
  },
  {
    id: "marketing-reels-2",
    title: "Marketing Reels Vol.2",
    mood: "chill",
    moodEmoji: "✨",
    url: "https://ik.imagekit.io/Tubeguruji/BgMusic/instagram-reels-marketing-music-469052.mp3",
  },
];
