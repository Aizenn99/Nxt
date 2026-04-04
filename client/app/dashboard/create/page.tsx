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
import { LANGUAGE_OPTIONS, VOICE_MODELS, BG_MUSIC_TRACKS } from "./constants";
import type { LanguageOption, VoiceModel, BgMusicTrack } from "./constants";

const steps = [
  "Niche Selection",
  "Language & Voice",
  "Background Music",
  "Script Generation",
  "Visual Assets",
  "Render Video",
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
  }>({
    niche: null,
    customNiche: "",
    isCustom: false,
    languageObj: null,
    voiceObj: null,
    bgMusic: [],
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
      return formData.bgMusic.length > 0;
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
        onClick={() => setCurrentStep((s) => s + 1)}
        disabled={!isValidStep()}
        className="rounded-xl cursor-pointer flex items-center gap-2"
      >
        {currentStep === 6 ? "Finish" : "Continue"}
        <ArrowRight className="w-4 h-4" />
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
                    Pick one or more tracks to set the mood — preview before you choose.
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
                              className={`w-[3px] rounded-full transition-all duration-300 ${
                                isPlaying
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

          {/* Placeholders for subsequent steps */}
          {currentStep > 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 mt-10">
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">{steps[currentStep - 1]}</h2>
                <p className="text-sm text-muted-foreground/80 max-w-md mx-auto px-4">This capability will be built out entirely in the next phase of development.</p>
              </div>
              <StepFooter />
            </div>
          )}
        </main>
      </SidebarInset>
    </>
  );
}