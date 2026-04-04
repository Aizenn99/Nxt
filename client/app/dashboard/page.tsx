"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ListVideo, 
  Video, 
  BookText, 
  Search,
  Filter,
  RefreshCw,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { SeriesCard } from "./SeriesCard";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardPage() {
  const user = useSelector((state: any) => state.auth.user);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchSeries = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("video_series")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSeries(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [user]);

  const filteredSeries = series.filter(s => 
    s.series_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
        <DashboardSidebar />
        
        <SidebarInset className="flex flex-col flex-1 bg-transparent">
          {/* Header */}
          <header className="flex h-16 items-center justify-between px-8 border-b border-white/5 bg-[#0a0a0c]/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white/60 hover:text-white cursor-pointer" />
              <h2 className="text-xl font-bold">My Series</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search series..." 
                  className="bg-white/5 border-white/10 h-9 pl-9 rounded-xl focus:border-purple-500 transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer"
                onClick={fetchSeries}
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground transition-all ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Total {series.length} series created
                  </h3>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-purple-600 text-white shadow-md">
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-white">
                    <ListIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {loading ? (
                /* Skeleton Loading */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-video w-full rounded-2xl bg-white/5" />
                      <Skeleton className="h-6 w-3/4 bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-white/5" />
                    </div>
                  ))}
                </div>
              ) : filteredSeries.length > 0 ? (
                /* Series Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {filteredSeries.map((s) => (
                    <SeriesCard key={s.id} series={s} onUpdate={fetchSeries} />
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-1000">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <ListVideo className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">No series found</h2>
                  <p className="text-muted-foreground max-w-sm mb-8">
                    {searchQuery 
                      ? `We couldn't find any series matching "${searchQuery}"` 
                      : "You haven't created any video series yet. Start your journey by creating your first automated video series."}
                  </p>
                  <Button 
                    className="gap-3 rounded-2xl px-8 h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xl shadow-purple-500/20 cursor-pointer"
                    onClick={() => router.push("/dashboard/create")}
                  >
                    <Plus className="w-5 h-5" />
                    Create First Series
                  </Button>
                </div>
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
