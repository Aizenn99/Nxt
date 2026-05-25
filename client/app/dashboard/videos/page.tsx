"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Plus, 
  Video, 
  RefreshCw,
  Search,
  Calendar,
  ExternalLink,
  Play,
  FileText,
  Music,
  ArrowLeft,
  Sparkles,
  Loader2,
  Clock,
  Trash2,
  Download,
  X
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { DashboardSidebar } from "../DashboardSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export default function VideosPage() {
  const user = useSelector((state: any) => state.auth.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInitializingBanner, setShowInitializingBanner] = useState(true);
  
  // Preview & Delete State
  const [previewVideo, setPreviewVideo] = useState<any>(null);
  const [videoToDelete, setVideoToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Enhanced Polling Logic
  useEffect(() => {
    // Check if any video is still in 'generating' status
    const hasGeneratingVideos = videos.some(v => v.status === 'generating');
    const isInitialGenerating = searchParams.get("generating") === "true";

    if (hasGeneratingVideos || isInitialGenerating) {
      setIsGenerating(true);
      const interval = setInterval(() => {
        fetchVideos(false);
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    } else {
      setIsGenerating(false);
    }
  }, [videos, searchParams]);

  // Auto-dismiss initializing banner after 15 seconds if stuck
  useEffect(() => {
    if (isGenerating && videos.filter(v => v.status === 'generating').length === 0) {
      const timer = setTimeout(() => {
        setShowInitializingBanner(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, videos]);

  const fetchVideos = async (showLoading = true) => {
    if (!user?.id) return;
    
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("generated_videos")
        .select(`
          *,
          video_series!inner (
            series_name,
            user_id
          )
        `)
        .eq("video_series.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err: any) {
      console.error("Fetch Videos Error:", err.message);
      if (showLoading) toast.error("Failed to load videos");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("generated_videos")
        .delete()
        .eq("id", videoToDelete.id);

      if (error) throw error;

      toast.success("Video deleted successfully");
      setVideos(prev => prev.filter(v => v.id !== videoToDelete.id));
      setVideoToDelete(null);
    } catch (err: any) {
      console.error("Delete Error:", err.message);
      toast.error("Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${title || 'video'}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error("Download Error:", err.message);
      // Fallback to new tab if fetch fails (e.g. CORS)
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.video_series?.series_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const isFailed = v.status === 'failed';
    return matchesSearch && !isFailed;
  });

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
        <DashboardSidebar />
        
        <SidebarInset className="flex flex-col flex-1 bg-transparent">
          <DashboardNavbar 
             title="Generated Videos" 
             showSearch 
             searchQuery={searchQuery}
             setSearchQuery={setSearchQuery}
             onRefresh={fetchVideos}
             loading={loading}
             backButtonHref="/dashboard"
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Total {videos.length} videos found
                  </h3>
                </div>
              </div>

              {/* Generating Status Banner */}
              {isGenerating && showInitializingBanner && videos.filter(v => v.status === 'generating').length === 0 && (
                <Card className="mb-8 overflow-hidden border-purple-500/30 bg-purple-500/5 backdrop-blur-sm relative group/banner">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          Initializing Generation
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Preparing your script and assets. It will be listed below shortly.
                        </p>
                      </div>
                    </div>
                    <Button 
                       variant="ghost" 
                       size="icon" 
                       className="opacity-0 group-hover/banner:opacity-100 transition-opacity absolute top-2 right-2 text-muted-foreground hover:text-white"
                       onClick={() => setShowInitializingBanner(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {loading ? (
                /* Skeleton Loading */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-video w-full rounded-2xl bg-white/5" />
                      <Skeleton className="h-6 w-3/4 bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-white/5" />
                    </div>
                  ))}
                </div>
              ) : filteredVideos.length > 0 ? (
                /* Videos Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredVideos.map((v) => {
                    const isGeneratingVideo = v.status === 'generating';
                    const isFailedVideo = v.status === 'failed';
                    // Extract first scene image
                    const firstScene = v.scenes && Array.isArray(v.scenes) ? v.scenes[0] : null;
                    const thumbnailUrl = firstScene?.imageUrl || "/placeholder-video.png";

                    return (
                      <Card key={v.id} className={`group overflow-hidden bg-white/5 border-white/10 transition-all duration-300 ${isGeneratingVideo ? 'border-purple-500/30 ring-1 ring-purple-500/10' : isFailedVideo ? 'border-red-500/30' : 'hover:border-purple-500/50'}`}>
                        <div className="relative aspect-video overflow-hidden bg-white/5">
                          {isGeneratingVideo ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-purple-500/5 backdrop-blur-sm">
                              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">
                                Generating...
                              </span>
                            </div>
                          ) : isFailedVideo ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-red-500/5 backdrop-blur-sm">
                              <Sparkles className="w-8 h-8 text-red-400/40" />
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                Generation Failed
                              </span>
                            </div>
                          ) : (
                            <>
                              <img
                                src={thumbnailUrl}
                                alt={v.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                              
                               <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                 <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-full bg-white/10 border-white/20 hover:bg-purple-600 hover:border-purple-500 text-white gap-2 cursor-pointer"
                                    onClick={() => setPreviewVideo(v)}
                                  >
                                    <Play className="w-4 h-4 fill-current" />
                                    Preview
                                  </Button>
                                  
                                  {v.video_url && !isGeneratingVideo && !isFailedVideo && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="rounded-full bg-white/10 border-white/20 hover:bg-blue-600 hover:border-blue-500 text-white gap-2 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(v.video_url, v.title);
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                      Download
                                    </Button>
                                  )}
                               </div>

                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 hover:bg-red-500/80 text-white h-8 w-8 rounded-full"
                                 onClick={() => setVideoToDelete(v)}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </>
                          )}

                          <div className="absolute bottom-3 left-3 right-3">
                            <Badge className={`backdrop-blur-md border-white/10 text-[10px] py-0 px-2 h-5 mb-1 ${isGeneratingVideo ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : isFailedVideo ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-black/50'}`}>
                              {v.status || "completed"}
                            </Badge>
                            <h4 className="text-sm font-bold text-white truncate shadow-sm">
                              {v.title || "Untitled Video"}
                            </h4>
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              {isGeneratingVideo ? (
                                <>
                                  <Clock className="w-3 h-3 text-purple-400 animate-pulse" />
                                  <span className="text-purple-300">Started just now</span>
                                </>
                              ) : isFailedVideo ? (
                                <>
                                  <Clock className="w-3 h-3 text-red-400" />
                                  <span className="text-red-300">Failed</span>
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-3 h-3" />
                                  <span>{format(new Date(v.created_at), "MMM d, yyyy")}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-purple-400/60 font-medium">#{v.video_series?.series_name}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-white/5 mt-2">
                            {isGeneratingVideo ? (
                              <div className="w-full py-2 text-center text-[10px] text-muted-foreground italic">
                                Finalizing assets...
                              </div>
                            ) : isFailedVideo ? (
                              <div className="w-full py-2 text-center text-[10px] text-red-400 italic">
                                Something went wrong
                              </div>
                            ) : (
                              <div className="w-full py-2 text-center text-[10px] text-muted-foreground italic">
                                Ready to produce
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Video className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">No videos yet</h2>
                  <p className="text-muted-foreground max-w-sm mb-8">
                    Trigger your first video generation to see it appear here.
                  </p>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Video Preview Modal */}
      <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent className="max-w-4xl bg-[#0a0a0c] border-white/10 p-1 flex flex-col gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 flex flex-row items-center justify-between border-b border-white/5">
            <div className="flex flex-col gap-1 pr-8 overflow-hidden">
               <DialogTitle className="text-white font-bold truncate">
                 {previewVideo?.title || "Video Preview"}
               </DialogTitle>
               <DialogDescription className="text-xs text-muted-foreground">
                 {previewVideo?.video_series?.series_name || "Text to Video"}
               </DialogDescription>
            </div>
          </DialogHeader>
          <div className="relative aspect-video bg-black rounded-b-xl overflow-hidden">
            {previewVideo?.video_url ? (
               <video 
                 src={previewVideo.video_url} 
                 controls 
                 autoPlay 
                 className="w-full h-full object-contain"
               />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">
                Video is not fully rendered yet or available.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent className="bg-[#0a0a0c] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This action cannot be undone. This will permanently delete the video
              <span className="text-white font-semibold"> "{videoToDelete?.title}" </span>
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-500 text-white cursor-pointer"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
