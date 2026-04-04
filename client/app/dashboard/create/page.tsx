"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Ghost,
  BookOpen,
  Check,
  Play,
  MonitorPlay,
  Pencil,
  ArrowRight,
  UserCircle,
  Plus,
  ListVideo,
  Video,
  BookText,
  Square,
  Volume2,
  Music2,
  Pause,
  Youtube,
  Instagram,
  Twitter,
  Mail,
  Clock,
  Layout,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useSelector } from "react-redux";
import { LANGUAGE_OPTIONS, VOICE_MODELS, BG_MUSIC_TRACKS, VIDEO_STYLES, CAPTION_STYLES, DURATION_OPTIONS, PLATFORMS } from "./constants";
import type { LanguageOption, VoiceModel, BgMusicTrack, VideoStyle, CaptionStyle } from "./constants";
import { CaptionPreview } from "./CaptionPreview";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const steps = [
  "Niche Selection",
  "Language & Voice",
  "Background Music",
  "Video Style",
  "Caption Style",
  "Series Details",
];

const availableNiches = [
  {
    id: "scary-stories",
    title: "Scary Stories",
    description: "Paranormal & horror content.",
    icon: <Ghost className="w-5 h-5 text-purple-400" />,
  },
  {
    id: "motivational",
    title: "Motivational",
    description: "Inspiring life lessons.",
    icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
  },
  {
    id: "educational",
    title: "Educational",
    description: "Facts, science & history.",
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
  },
  {
    id: "bedtime",
    title: "Bedtime Stories",
    description: "Relaxing sleep stories.",
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
  },
  {
    id: "tech-news",
    title: "Tech News",
    description: "Latest AI & tech updates.",
    icon: <MonitorPlay className="w-5 h-5 text-cyan-400" />,
  },
];

// Sidebar
function VideoSidebar() {
  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="p-4 border-b  border-white/10">
        <h2 className="text-sm uppercase tracking-wide mb-4  text-muted-foreground">
          Video Dashboard
        </h2>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="gap-3 rounded-xl bg-white/5 cursor-pointer  h-10">
                <Plus className="w-4 h-4 text-purple-400" />
                Create Series
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton className="gap-3 rounded-xl h-10">
                <ListVideo className="w-4 h-4" /> Series
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="gap-3 rounded-xl h-10">
                <Video className="w-4 h-4" /> Videos
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="gap-3 rounded-xl h-10">
                <BookText className="w-4 h-4" /> Guides
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function CreateVideo() {
  const { user } = useSelector((state: any) => state.auth);
  const [currentStep, setCurrentStep] = useState(1);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const [formData, setFormData] = useState<{
    niche: string | null;
    customNiche: string;
    isCustom: boolean;
    languageObj: LanguageOption | null;
    voiceObj: VoiceModel | null;
    bgMusic: BgMusicTrack[];
    videoStyle: VideoStyle | null;
    captionStyle: CaptionStyle | null;
    seriesName: string;
    duration: string;
    platforms: string[];
    publishTime: string;
    publishPeriod: "AM" | "PM";
  }>({
    niche: null,
    customNiche: "",
    isCustom: false,
    languageObj: null,
    voiceObj: null,
    bgMusic: [],
    videoStyle: null,
    captionStyle: null,
    seriesName: "",
    duration: "",
    platforms: [],
    publishTime: "",
    publishPeriod: "AM",
  });

  const toggleBgMusic = (track: BgMusicTrack) => {
    setFormData((prev) => {
      const already = prev.bgMusic.some((t) => t.id === track.id);
      return {
        ...prev,
        bgMusic: already
          ? prev.bgMusic.filter((t) => t.id !== track.id)
          : [...prev.bgMusic, track],
      };
    });
  };

  const togglePlay = (previewFile: string) => {
    if (playingPreview === previewFile) {
      audioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audioSrc = previewFile.startsWith("http") ? previewFile : `/${previewFile}`;
      const audio = new Audio(audioSrc);
      audio.onended = () => setPlayingPreview(null);
      audio.play().catch(e => console.error("Audio play failed", e));
      audioRef.current = audio;
      setPlayingPreview(previewFile);
    }
  };

  const updateFormData = (fields: any) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const progress =
    ((currentStep - 1) / (steps.length - 1)) * 100;

  const isValidStep = () => {
    if (currentStep === 1) {
      return formData.isCustom
        ? formData.customNiche.trim().length > 0
        : formData.niche !== null;
    }
    if (currentStep === 2) {
      return formData.languageObj !== null && formData.voiceObj !== null;
    }
    if (currentStep === 3) {
      return true;
    }
    if (currentStep === 4) {
      return formData.videoStyle !== null;
    }
    if (currentStep === 5) {
      return formData.captionStyle !== null;
    }
    if (currentStep === 6) {
      return (
        formData.seriesName.trim().length > 0 &&
        formData.duration !== "" &&
        formData.platforms.length > 0 &&
        formData.publishTime !== ""
      );
    }
    return true;
  };

  const StepFooter = () => (
    <div className="mt-8 flex justify-between items-center gap-4 border-t border-white/10 pt-6">
      <Button
        variant="outline"
        disabled={currentStep === 1}
        onClick={() => setCurrentStep((s) => s - 1)}
        className="rounded-xl cursor-pointer"
      >
        Back
      </Button>

      <Button
        onClick={() => {
          if (currentStep < 6) {
            setCurrentStep((s) => s + 1);
          } else {
            alert("Series Scheduled Successfully!");
            console.log("Final Series Data:", formData);
          }
        }}
        disabled={!isValidStep()}
        className="rounded-xl cursor-pointer flex items-center gap-2"
      >
        {currentStep === 6 ? "Schedule Series" : "Continue"}
        {currentStep === 6 ? <Clock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      </Button>
    </div>
  );

  return (
    <>
      <VideoSidebar />

      <SidebarInset className="bg-[#0b0b0f] text-white min-h-screen">
        {/* Navbar */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link href="/" className="text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">
              NxtAi
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center  gap-2 text-sm text-muted-foreground">
              <Play className="w-4 h-4 text-purple-400" />
              Video Creation
            </div>

            <Avatar className="w-9 h-9">
              <AvatarImage src="" />
              <AvatarFallback>
                {user?.name ? user.name[0] : <UserCircle />}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="w-[800px] mx-auto px-4 py-10">
          {/* STEP HEADER */}
          <div className="mb-10">
            <p className="text-xs text-muted-foreground">
              STEP {currentStep} OF {steps.length}
            </p>

            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 p-2 duration-500">
              <div className="px-4 py-2 bg-white/5 rounded-xl">
                <h2 className="text-xl  font-semibold mb-2">
                  Choose Your Niche
                </h2>
                <p className="text-xs text-muted-foreground  ">
                  Select or create your niche
                </p>
              </div>

              <Tabs
                defaultValue="available"
                onValueChange={(v) =>
                  updateFormData({ isCustom: v === "custom" })
                }
              >
                <TabsList className="mb-6 mt-4 ">
                  <TabsTrigger value="available" className="cursor-pointer p-2 rounded-lg ">
                    Available
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="cursor-pointer p-2 rounded-lg ">
                    Custom
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {availableNiches.map((n) => (
                      <div
                        key={n.id}
                        onClick={() =>
                          updateFormData({ niche: n.id })
                        }
                        className={`p-4 rounded-xl border cursor-pointer transition
                        ${formData.niche === n.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 hover:border-white/20"
                          }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-1">{n.icon}</div>
                          <div>
                            <h3 className="text-sm font-medium">
                              {n.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {n.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="custom">
                  <Textarea
                    placeholder="Describe your idea..."
                    value={formData.customNiche}
                    onChange={(e) =>
                      updateFormData({
                        customNiche: e.target.value,
                      })
                    }
                    className="min-h-[180px] bg-white/5 border-white/10 p-4"
                  />
                </TabsContent>
              </Tabs>

              <StepFooter />
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-semibold mb-2">
                Language & Voice
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Select the spoken language and AI voice actor
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-medium mb-3">Language</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {LANGUAGE_OPTIONS.map((lang, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          updateFormData({ languageObj: lang, voiceObj: null });
                          if (playingPreview) togglePlay(playingPreview); // Stop audio on language change
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition text-sm flex items-center justify-between
                        ${formData.languageObj?.modelLanguageCode === lang.modelLanguageCode
                            ? "border-purple-500 bg-purple-500/10 text-purple-300"
                            : "border-white/10 hover:border-white/20 bg-white/5"
                          }`}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-lg">{lang.countryFlag}</span>
                          {lang.language}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.languageObj && (
                  <div className="animate-in fade-in duration-300">
                    <h3 className="text-sm font-medium mb-3">
                      Voice Actor <span className="text-muted-foreground ml-1 text-xs">({formData.languageObj.modelName})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(VOICE_MODELS[formData.languageObj.modelName] ?? []).map((voice, idx) => {
                        const isSelected = formData.voiceObj?.modelName === voice.modelName;
                        const isPlaying = playingPreview === voice.preview;

                        return (
                          <div
                            key={idx}
                            onClick={() => updateFormData({ voiceObj: voice })}
                            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col gap-3
                            ${isSelected
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-white/10 hover:border-white/20 bg-white/5"
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className={`capitalize text-sm font-medium ${isSelected ? "text-purple-300" : "text-white"}`}>
                                  {voice.modelName}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/5">
                                  {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                                </span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Model: {voice.model}
                              </span>

                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 rounded-full ${isPlaying ? "bg-purple-500/20 text-purple-400" : "hover:bg-white/10"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlay(voice.preview);
                                }}
                              >
                                {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {(VOICE_MODELS[formData.languageObj.modelName]?.length === 0) && (
                        <div className="text-sm text-muted-foreground p-4 bg-white/5 rounded-xl border border-white/10 col-span-full">
                          No voices available for this model yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <StepFooter />
            </div>
          )}


          {/* STEP 3 — Background Music */}
          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-4 py-3 bg-white/5 rounded-xl mb-6 flex items-start gap-3">
                <Music2 className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold">Background Music</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Pick one or more tracks (optional) — preview before you choose.
                  </p>
                </div>
              </div>

              {/* Selected count badge */}
              {formData.bgMusic.length > 0 && (
                <div className="mb-4 flex items-center gap-2 animate-in fade-in duration-300">
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-medium">
                    {formData.bgMusic.length} track{formData.bgMusic.length > 1 ? "s" : ""} selected
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BG_MUSIC_TRACKS.map((track) => {
                  const isSelected = formData.bgMusic.some((t) => t.id === track.id);
                  const isPlaying = playingPreview === track.url;

                  return (
                    <div
                      key={track.id}
                      onClick={() => toggleBgMusic(track)}
                      className={`relative group p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col gap-3
                        ${isSelected
                          ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                          : "border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/[0.07]"
                        }`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {/* Animated music orb */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all
                            ${isSelected ? "bg-purple-500/25" : "bg-white/10"}`}>
                            {track.moodEmoji}
                          </div>

                          <div>
                            <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-purple-300" : "text-white"}`}>
                              {track.title}
                            </p>
                            <span className="text-xs text-muted-foreground capitalize mt-0.5 block">
                              {track.mood} · loop
                            </span>
                          </div>
                        </div>

                        {/* Checkbox indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${isSelected
                            ? "border-purple-500 bg-purple-500"
                            : "border-white/20 group-hover:border-white/40"
                          }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      {/* Waveform decoration + play button */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Decorative waveform bars */}
                        <div className="flex items-end gap-[3px] h-6 flex-1">
                          {[4, 8, 6, 10, 7, 12, 5, 9, 11, 6, 8, 4, 10, 7].map((h, i) => (
                            <div
                              key={i}
                              className={`w-[3px] rounded-full transition-all duration-300 ${isPlaying
                                ? "bg-purple-400 animate-pulse"
                                : isSelected
                                  ? "bg-purple-500/60"
                                  : "bg-white/20"
                                }`}
                              style={{
                                height: `${h}px`,
                                animationDelay: isPlaying ? `${i * 60}ms` : "0ms",
                              }}
                            />
                          ))}
                        </div>

                        {/* Preview play/stop button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-9 w-9 p-0 rounded-full shrink-0 transition-all
                            ${isPlaying
                              ? "bg-purple-500/25 text-purple-400 hover:bg-purple-500/35"
                              : "hover:bg-white/10 text-muted-foreground hover:text-white"
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay(track.url);
                          }}
                        >
                          {isPlaying
                            ? <Pause className="w-4 h-4 fill-current" />
                            : <Play className="w-4 h-4 fill-current" />
                          }
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <StepFooter />
            </div>
          )}

          {/* STEP 4 — Video Style */}
          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-4 py-3 bg-white/5 rounded-xl mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold">Video Style</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select the visual aesthetic for your video assets.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-380px)] overflow-y-auto pr-3 
                [&::-webkit-scrollbar]:w-1.5 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-white/10 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                {VIDEO_STYLES.map((style) => {
                  const isSelected = formData.videoStyle?.id === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => updateFormData({ videoStyle: style })}
                      className={`relative group rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 aspect-[21/9]
                        ${isSelected
                          ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                          : "border-white/10 hover:border-white/30"
                        }`}
                    >
                      <img
                        src={`/${style.image}`}
                        alt={style.title}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 
                          ${isSelected ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold text-lg ${isSelected ? "text-white" : "text-white/90"}`}>
                            {style.title}
                          </span>
                          {isSelected && (
                            <div className="bg-purple-500 rounded-full p-1 shadow-lg">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <StepFooter />
            </div>
          )}

          {/* STEP 5 — Caption Style */}
          {currentStep === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-4 py-3 bg-white/5 rounded-xl mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold">Caption Style</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select the visual style and animation for your video captions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-380px)] overflow-y-auto pr-3
                [&::-webkit-scrollbar]:w-1.5 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-white/10 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                {CAPTION_STYLES.map((style) => {
                  const isSelected = formData.captionStyle?.id === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => updateFormData({ captionStyle: style })}
                      className={`relative group rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 flex flex-col
                        ${isSelected
                          ? "border-purple-500 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                          : "border-white/10 hover:border-white/25 bg-white/5"
                        }`}
                    >
                      {/* Preview Area */}
                      <div className="h-28 w-full p-2">
                        <CaptionPreview 
                          styleId={style.id} 
                          text={style.name} 
                          className={isSelected ? "bg-black/60" : "bg-black/20"}
                        />
                      </div>
                      
                      {/* Info Area */}
                      <div className="p-3 border-t border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-semibold text-sm ${isSelected ? "text-purple-300" : "text-white"}`}>
                            {style.name}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {style.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <StepFooter />
            </div>
          )}

          {/* STEP 6 — Series Details */}
          {currentStep === 6 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-4 py-3 bg-white/5 rounded-xl mb-6 flex items-start gap-3">
                <Layout className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold">Series Details</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure the final metadata and schedule your series.
                  </p>
                </div>
              </div>

              <div className="space-y-6 max-h-[calc(100vh-380px)] overflow-y-auto pr-3
                [&::-webkit-scrollbar]:w-1.5 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-white/10 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                
                {/* Series Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Series Name</label>
                  <Input 
                    placeholder="e.g. Daily Motivation, Scary Facts..." 
                    value={formData.seriesName}
                    onChange={(e) => updateFormData({ seriesName: e.target.value })}
                    className="bg-white/5 border-white/10 h-11 focus:border-purple-500 transition-all rounded-xl"
                  />
                </div>

                {/* Duration & Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Video Duration</label>
                    <Select 
                      value={formData.duration} 
                      onValueChange={(val) => updateFormData({ duration: val })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a20] border-white/10 text-white">
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="focus:bg-purple-500/20 focus:text-purple-300 cursor-pointer">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Publish Time</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input 
                          type="time"
                          value={formData.publishTime}
                          onChange={(e) => updateFormData({ publishTime: e.target.value })}
                          className="bg-white/5 border-white/10 h-11 focus:border-purple-500 transition-all rounded-xl pl-10 [color-scheme:dark]"
                        />
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl h-11 shrink-0">
                        {["AM", "PM"].map((p) => (
                          <button
                            key={p}
                            onClick={() => updateFormData({ publishPeriod: p })}
                            className={`px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer
                              ${formData.publishPeriod === p 
                                ? "bg-purple-500 text-white shadow-lg" 
                                : "text-muted-foreground hover:text-white"}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-white/80">Target Platforms</label>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      Multi-select enabled
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PLATFORMS.map((p) => {
                      const isSelected = formData.platforms.includes(p.id);
                      const Icon = { Youtube, Instagram, Twitter, Mail }[p.icon] as any;
                      
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            const newPlatforms = isSelected
                              ? formData.platforms.filter((id) => id !== p.id)
                              : [...formData.platforms, p.id];
                            updateFormData({ platforms: newPlatforms });
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2
                            ${isSelected
                              ? "border-purple-500 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                              : "border-white/10 bg-white/5 hover:border-white/25 text-muted-foreground hover:text-white"
                            }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? "text-purple-400" : ""}`} />
                          <span className="text-xs font-medium">{p.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] text-blue-300/80 leading-relaxed italic">
                    Note: The AI video will be generated 3-6 hours before your scheduled publish time to ensure high-quality processing and quality checks.
                  </p>
                </div>
              </div>

              <StepFooter />
            </div>
          )}
        </main>
      </SidebarInset>
    </>
  );
}
