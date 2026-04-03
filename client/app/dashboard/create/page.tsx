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

const steps = [
  "Niche Selection",
  "Language & Voice",
  "Script Generation",
  "Visual Assets",
  "Music & Effects",
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
      <SidebarHeader className="p-4 border-b border-white/10">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
          Video Dashboard
        </h2>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="gap-3 rounded-xl h-10">
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

  const [formData, setFormData] = useState({
    niche: null as string | null,
    customNiche: "",
    isCustom: false,
  });

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
      return (formData.language || "").trim().length > 0 && (formData.voice || "").trim().length > 0;
    }
    return true;
  };

  const StepFooter = () => (
    <div className="mt-8 flex justify-between items-center gap-4 border-t border-white/10 pt-6">
      <Button
        variant="outline"
        disabled={currentStep === 1}
        onClick={() => setCurrentStep((s) => s - 1)}
        className="rounded-xl"
      >
        Back
      </Button>

      <Button
        onClick={() => setCurrentStep((s) => s + 1)}
        disabled={!isValidStep()}
        className="rounded-xl flex items-center gap-2"
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
            <Link href="/" className="text-lg font-semibold">
              NxtAi
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold mb-2">
                Choose Your Niche
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Select or create your niche
              </p>

              <Tabs
                defaultValue="available"
                onValueChange={(v) =>
                  updateFormData({ isCustom: v === "custom" })
                }
              >
                <TabsList className="mb-6">
                  <TabsTrigger value="available">
                    Available
                  </TabsTrigger>
                  <TabsTrigger value="custom">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["English (US)", "English (UK)", "Spanish", "French", "German", "Hindi"].map(lang => (
                      <div
                        key={lang}
                        onClick={() => updateFormData({ language: lang })}
                        className={`p-3 rounded-xl border cursor-pointer transition text-center text-sm font-medium
                        ${formData.language === lang
                          ? "border-purple-500 bg-purple-500/10 text-purple-300"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                        }`}
                      >
                        {lang}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Voice Actor</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "male-1", label: "Male - Deep & Trustworthy" },
                      { id: "male-2", label: "Male - Energetic" },
                      { id: "female-1", label: "Female - Calm & Professional" },
                      { id: "female-2", label: "Female - Bright & Enthusiastic" }
                    ].map(voice => (
                      <div
                        key={voice.id}
                        onClick={() => updateFormData({ voice: voice.id })}
                        className={`p-4 rounded-xl border cursor-pointer transition text-sm font-medium
                        ${formData.voice === voice.id
                          ? "border-purple-500 bg-purple-500/10 text-purple-300"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                        }`}
                      >
                        {voice.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <StepFooter />
            </div>
          )}

          {/* Placeholders for subsequent steps */}
          {currentStep > 2 && (
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