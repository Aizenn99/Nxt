"use client";

import React from "react";
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  Video, 
  Layers, 
  Palette, 
  Mic, 
  History, 
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { DashboardSidebar } from "../DashboardSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function GuidesPage() {
  const guideSections = [
    {
      title: "Core Features",
      items: [
        {
          title: "Automated Video Series",
          description: "Learn how to create a series that generates videos automatically on a schedule. Perfect for YouTube Shorts, Reels, and TikTok.",
          icon: Layers,
          color: "text-purple-400",
          bgColor: "bg-purple-500/10",
          link: "/dashboard/create"
        },
        {
          title: "Text-to-Video Tool",
          description: "Generate one-off, high-quality 10s videos and matching concept images from a single descriptive prompt.",
          icon: Sparkles,
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          link: "/dashboard/text-to-video"
        },
        {
          title: "Manage Your Content",
          description: "Keep track of all your generated assets, download them in high resolution, and manage your active series.",
          icon: History,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          link: "/dashboard/videos"
        }
      ]
    },
    {
      title: "AI Engines & Styles",
      items: [
        {
          title: "Cinematic Image Models",
          description: "We use state-of-the-art models like SDXL to ensure every frame of your video looks professionally crafted.",
          icon: Palette,
          color: "text-pink-400",
          bgColor: "bg-pink-500/10"
        },
        {
          title: "Premium AI Voices",
          description: "Choose from a wide range of natural-sounding voices across multiple languages, powered by Deepgram and Fonada.",
          icon: Mic,
          color: "text-orange-400",
          bgColor: "bg-orange-500/10"
        },
        {
          title: "Video Synthesis",
          description: "Experience the power of the Wan 2.1 engine, capable of generating fluid motion and realistic physics from text.",
          icon: Cpu,
          color: "text-cyan-400",
          bgColor: "bg-cyan-500/10"
        }
      ]
    }
  ];

  const faqs = [
    {
      q: "How many credits does a generation cost?",
      a: "A single image generation costs 1 credit. A full video series episode (including script, voice, and 5+ images) costs approximately 10-15 credits depending on the number of scenes."
    },
    {
      q: "Can I use the generated videos for commercial purposes?",
      a: "Yes, all videos generated through NxtAi are yours to use commercially. We provide high-resolution outputs suitable for all social media platforms."
    },
    {
      q: "What languages are supported?",
      a: "We currently support Hindi, English, Spanish, French, and many others through our diverse range of AI voice models."
    }
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
        <DashboardSidebar />
        
        <SidebarInset className="flex flex-col flex-1 bg-transparent">
          <DashboardNavbar title="Usage Guides" />

          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-16 pb-20">
              
              {/* Hero Banner */}
              <section className="relative p-12 rounded-[40px] bg-gradient-to-br from-purple-600/10 via-blue-600/5 to-transparent border border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] -mr-48 -mt-48 rounded-full" />
                <div className="relative z-10 max-w-2xl space-y-6">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-purple-400 px-4 py-1.5 rounded-full backdrop-blur-md">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Documentation
                  </Badge>
                  <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
                    Master the Art of <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AI Video Creation</span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Everything you need to know about NxtAi's automated generation pipeline, from selecting voices to publishing your first series.
                  </p>
                </div>
              </section>

              {/* Guide Sections */}
              {guideSections.map((section, idx) => (
                <section key={idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 200}ms` }}>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    {section.title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.items.map((item, i) => (
                      <Card key={i} className="group bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-500 rounded-[32px] overflow-hidden flex flex-col">
                        <CardContent className="p-8 flex-1 flex flex-col space-y-6">
                          <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-inner ring-1 ring-inset ring-white/5`}>
                            <item.icon className={`w-7 h-7 ${item.color}`} />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold">{item.title}</h3>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                              {item.description}
                            </p>
                          </div>
                          {item.link && (
                            <div className="pt-4 mt-auto">
                              <Button 
                                variant="ghost" 
                                className="group/btn p-0 h-auto text-purple-400 hover:text-purple-300 hover:bg-transparent transition-all flex items-center gap-2"
                                onClick={() => window.open(item.link, "_self")}
                              >
                                Try it now
                                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}

              {/* FAQ Section */}
              <section className="bg-white/5 rounded-[40px] border border-white/10 p-12 space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-black">Common Questions</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Quick answers to the most frequent inquiries from our creators.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {faqs.map((faq, i) => (
                    <div key={i} className="p-8 rounded-3xl bg-[#0a0a0c]/50 border border-white/5 space-y-4 hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-3">
                         <HelpCircle className="w-5 h-5 text-purple-400" />
                         <h4 className="text-lg font-bold">{faq.q}</h4>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-8">
                   <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-purple-600/5 border border-purple-500/20 text-purple-300 text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      More detailed help is always available through our support chat.
                   </div>
                </div>
              </section>

            </div>
          </main>
        </SidebarInset>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </SidebarProvider>
  );
}
