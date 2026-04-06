"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Pause,
  Play,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  Layout,
  History
} from "lucide-react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SeriesListItemProps {
  series: any;
  onUpdate: () => void;
}

export function SeriesListItem({ series, onUpdate }: SeriesListItemProps) {
  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();
  const isPaused = series.status === "paused";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const toggleStatus = async () => {
    try {
      const newStatus = isPaused ? "scheduled" : "paused";
      const { error } = await supabase
        .from("video_series")
        .update({ status: newStatus })
        .eq("id", series.id);

      if (error) throw error;
      toast.success(`Series ${isPaused ? "resumed" : "paused"} successfully`);
      onUpdate();
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const deleteSeries = async () => {
    try {
      const { error } = await supabase
        .from("video_series")
        .delete()
        .eq("id", series.id);

      if (error) throw error;
      toast.success("Series deleted successfully");
      setIsDeleteDialogOpen(false);
      onUpdate();
    } catch (err: any) {
      toast.error("Failed to delete series: " + err.message);
    }
  };

  const triggerGeneration = async () => {
    try {
      if (!user) {
        toast.error("You must be logged in to trigger generation");
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/series/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId: series.id }),
        credentials: "include"
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to trigger generation");
      }
      toast.success("Manual generation triggered!", {
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      });
      router.push("/dashboard/videos?generating=true");
    } catch (err: any) {
      toast.error("Failed to trigger generation: " + err.message);
    }
  };

  const thumbnail = series.video_style?.image
    ? `/${series.video_style.image}`
    : "/video-style/Realistic.png";

  return (
    <Card className="flex items-center gap-4 p-3 bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-300 group">
      {/* Small Thumbnail */}
      <div className="relative h-16 w-24 rounded-lg overflow-hidden shrink-0 border border-white/10">
        <img src={thumbnail} alt={series.series_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Title & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-white truncate text-base">{series.series_name}</h3>
          <Badge className={`
            ${isPaused ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}
            px-2 py-0 text-[9px] uppercase font-black tracking-wider h-4
          `}>
            {series.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
             <Layout className="w-3 h-3" />
             <span className="capitalize">{series.niche}</span>
          </div>
          <div className="flex items-center gap-1">
             <Calendar className="w-3 h-3" />
             <span>{format(new Date(series.created_at), "MMM d")}</span>
          </div>
          <div className="flex items-center gap-1">
             <Clock className="w-3 h-3 text-purple-400" />
             <span>{series.publish_time} {series.publish_period}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pr-2">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 rounded-xl hover:bg-white/5 hover:text-purple-400 transition-all cursor-pointer"
            onClick={triggerGeneration}
            title="Trigger Now"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button
             size="sm"
             variant="ghost"
             className="h-9 w-9 rounded-xl hover:bg-white/5 hover:text-white transition-all cursor-pointer"
             onClick={() => router.push(`/dashboard/create?id=${series.id}`)}
             title="Edit"
          >
             <Pencil className="w-4 h-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white rounded-full cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a20] border-white/10 text-white w-40">
            <DropdownMenuItem className="cursor-pointer focus:bg-purple-500/10 focus:text-purple-300" onClick={toggleStatus}>
              {isPaused ? <Play className="w-3.5 h-3.5 mr-2" /> : <Pause className="w-3.5 h-3.5 mr-2" />}
              {isPaused ? "Resume" : "Pause"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a1a20] border-white/10 rounded-2xl text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 text-sm">
              This action will permanently delete the <strong>{series.series_name}</strong> series.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSeries}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl cursor-pointer"
            >
              Delete Series
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
