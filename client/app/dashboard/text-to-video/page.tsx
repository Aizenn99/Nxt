"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Video, 
  Image as ImageIcon,
  ArrowLeft,
  RefreshCw,
  Play,
  ExternalLink,
  Download,
  Clock,
  History
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { DashboardSidebar } from "../DashboardSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";

export default function TextToVideoPage() {
  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent one-off videos
  const fetchRecentVideos = async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setLoading(true);

    try {
      const { data, error } = await supabase
        .from("generated_videos")
        .select("*")
        .is("series_id", null) // Fetch only one-off text-to-video generations
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentVideos(data || []);
      
      // If the top one is still generating, keep polling
      if (data?.[0]?.status === 'generating') {
        setIsGenerating(true);
        setActiveVideo(data[0]);
      } else if (data?.[0]) {
        setActiveVideo(data[0]);
        setIsGenerating(false);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentVideos();
  }, [user]);

  // Polling logic when generating
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        fetchRecentVideos(false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setLoading(true);

    try {
      const res = await axios.post(`${backendUrl}/api/generate/text-to-video`, {
        prompt,
        userId: user?.id
      });

      if (res.data.success) {
        toast.info("Generation started! This will take about a minute.");
        setPrompt("");
        fetchRecentVideos(false);
      }
    } catch (err: any) {
      console.error("Generation Trigger Error:", err);
      toast.error("Failed to start generation");
      setIsGenerating(false);
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
        <DashboardSidebar />
        
        <SidebarInset className="flex flex-col flex-1 bg-transparent">
          <DashboardNavbar title="Text to Video" />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-12">
              
              {/* Input Section */}
              <section className="space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-4xl font-black bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                    What are we imagining today?
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Generate a high-quality 10s video and matching concept images.
                  </p>
                </div>

                <div className="relative group max-w-3xl mx-auto">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex gap-2 p-2 bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl">
                    <Input 
                      placeholder="A futuristic cyber city at sunset, neon lights reflecting in the rain..." 
                      className="flex-1 bg-transparent border-none focus-visible:ring-0 text-lg h-14 px-4"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                    <Button 
                      className="h-14 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:bg-white/5 disabled:text-white/20"
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Generate 
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </section>

              {/* Active Result Section */}
              <section>
                {activeVideo ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Left: Video Player (2/3 width) */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold flex items-center gap-2">
                           <Video className="w-5 h-5 text-purple-400" />
                           Latest Creation
                         </h3>
                         <Badge className={activeVideo.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400 animate-pulse'}>
                            {activeVideo.status || "completed"}
                         </Badge>
                      </div>
                      
                      <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl group">
                        {activeVideo.status === 'generating' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0a0a0c]/80 backdrop-blur-md">
                            <div className="relative">
                              <div className="absolute inset-0 bg-purple-600 blur-2xl opacity-20 animate-pulse"></div>
                              <Loader2 className="w-16 h-16 text-purple-500 animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-1">
                               <p className="text-xl font-bold tracking-tight">Crafting your video...</p>
                               <p className="text-sm text-muted-foreground">Synthesizing frames and matching aesthetics.</p>
                            </div>
                          </div>
                        ) : activeVideo.video_url ? (
                          <video 
                            src={activeVideo.video_url} 
                            controls 
                            autoPlay 
                            loop
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5 italic text-muted-foreground">
                            Video assets are still loading...
                          </div>
                        )}
                        
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button 
                             size="icon" 
                             variant="secondary" 
                             className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform"
                             onClick={() => window.open(activeVideo.video_url, '_blank')}
                           >
                              <Download className="w-5 h-5" />
                           </Button>
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                        <p className="text-white/80 italic leading-relaxed font-medium">
                          "{activeVideo.title}"
                        </p>
                      </div>
                    </div>

                    {/* Right: Companion Images (1/3 width) */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-400" />
                        Inspiration Stills
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {activeVideo.status === 'generating' ? (
                          [1, 2, 3].map(i => (
                            <Skeleton key={i} className="aspect-video rounded-2xl bg-white/5" />
                          ))
                        ) : (
                          activeVideo.scenes?.map((scene: any, i: number) => (
                            <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group cursor-pointer">
                              <img 
                                src={scene.imageUrl} 
                                alt={`Style reference ${i+1}`} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <ExternalLink className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : !loading && (
                   <div className="py-24 text-center space-y-4 bg-white/5 rounded-[40px] border border-white/5">
                      <div className="w-20 h-20 rounded-3xl bg-purple-600/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20 shadow-inner">
                        <Sparkles className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-bold">No generations yet</h3>
                      <p className="text-muted-foreground">Type a prompt above to start your creative journey.</p>
                   </div>
                )}

                {loading && !activeVideo && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                      <Skeleton className="h-8 w-48 bg-white/5" />
                      <Skeleton className="aspect-video w-full rounded-3xl bg-white/5" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-48 bg-white/5" />
                      <Skeleton className="aspect-video w-full rounded-2xl bg-white/5" />
                      <Skeleton className="aspect-video w-full rounded-2xl bg-white/5" />
                    </div>
                  </div>
                )}
              </section>

              {/* History Section */}
              {recentVideos.length > 1 && (
                <section className="space-y-6 pt-12 border-t border-white/5">
                   <div className="flex items-center justify-between">
                     <h3 className="text-xl font-bold flex items-center gap-2">
                       <History className="w-5 h-5 text-muted-foreground" />
                       Recent Work
                     </h3>
                     <Button variant="ghost" className="text-purple-400 hover:text-purple-300" onClick={() => router.push("/dashboard/videos")}>
                        View all videos
                     </Button>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {recentVideos.slice(1).map((v) => (
                        <Card 
                          key={v.id} 
                          className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group rounded-2xl overflow-hidden"
                          onClick={() => setActiveVideo(v)}
                        >
                           <div className="relative aspect-video">
                              <img 
                                src={v.scenes?.[0]?.imageUrl || "/placeholder-video.png"} 
                                className="w-full h-full object-cover transition-opacity group-hover:opacity-40" 
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                 <Play className="w-8 h-8 fill-white/20 text-white" />
                              </div>
                           </div>
                           <CardContent className="p-4 space-y-2">
                              <h4 className="text-sm font-bold truncate">{v.title}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                 <Clock className="w-3 h-3" />
                                 {format(new Date(v.created_at), "MMM d, HH:mm")}
                              </div>
                           </CardContent>
                        </Card>
                      ))}
                   </div>
                </section>
              )}

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
