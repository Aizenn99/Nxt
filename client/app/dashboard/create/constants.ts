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
// ─── Video Styles ────────────────────────────────────────────────────────────

export interface VideoStyle {
  id: string;
  title: string;
  /** Path relative to /public — e.g. "video-style/Cyberpunk.png" */
  image: string;
}

export const VIDEO_STYLES: VideoStyle[] = [
  { id: "ghibli", title: "Ghibli", image: "video-style/Ghibli.png" },
  { id: "realistic", title: "Realistic", image: "video-style/Realistic.png" },
  { id: "magical", title: "Magical", image: "video-style/Magical.png" },
  { id: "gaming", title: "Gaming", image: "video-style/Gaming.png" },
  { id: "cyberpunk", title: "Cyberpunk", image: "video-style/Cyberpunk.png" },
];
// ─── Caption Styles ─────────────────────────────────────────────────────────

export interface CaptionStyle {
  id: string;
  name: string;
  description: string;
}

export const CAPTION_STYLES: CaptionStyle[] = [
  { id: "karaoke",   name: "Karaoke",   description: "Dynamic word-by-word highlights" },
  { id: "typewriter",name: "Typewriter",description: "Classic retro typing effect" },
  { id: "pop",       name: "Pop In",    description: "Words pop with smooth scaling" },
  { id: "slide",     name: "Slide Up",  description: "Words slide up into position" },
  { id: "glow",      name: "Pulse Glow",description: "Luminescent breathing effect" },
  { id: "shake",     name: "Impact",    description: "High-energy jitter effect" },
];

// ─── Step 6: Series Details ───────────────────────────────────────────────────

export const DURATION_OPTIONS = [ 
  { label: "30-50 Second Video", value: "30-50" },
  { label: "60-70 Second Video", value: "60-70" },
];

export const PLATFORMS = [
  { id: "youtube",   name: "YouTube",   icon: "Youtube"   },
  { id: "instagram", name: "Instagram", icon: "Instagram" },
  { id: "x",         name: "X",         icon: "Twitter"   },
  { id: "email",     name: "Email",     icon: "Mail"      },
];
