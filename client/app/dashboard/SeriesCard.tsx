"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  Layout,
  History
} from "lucide-react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
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

interface SeriesCardProps {
  series: any;
  onUpdate: () => void;
}

export function SeriesCard({ series, onUpdate }: SeriesCardProps) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seriesId: series.id }),
        credentials: "include" // This ensures the 'token' cookie is sent
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to trigger generation");
      }

      toast.success("Manual generation triggered! Your video will be ready shortly.", {
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      });
    } catch (err: any) {
      toast.error("Failed to trigger generation: " + err.message);
    }
  };

  // Extract thumbnail from video_style
  const thumbnail = series.video_style?.image
    ? `/${series.video_style.image}`
    : "/video-style/Realistic.png";

  return (
    <Card className="group overflow-hidden bg-white/5 border-white/10 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm">
      {/* Thumbnail Area */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={series.series_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`
            ${isPaused ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}
            backdrop-blur-md px-2 py-0.5 text-[10px] uppercase font-bold
          `}>
            {series.status}
          </Badge>
        </div>

        <button 
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-purple-500 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
          onClick={() => router.push(`/dashboard/create?id=${series.id}`)}
        >
          <Pencil className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white truncate drop-shadow-md">
            {series.series_name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-white/60">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(series.created_at), "MMM d, yyyy")}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <Layout className="w-3 h-3" />
            <span>{series.niche}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Scheduled: {series.publish_time} {series.publish_period}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white rounded-full cursor-pointer">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a20] border-white/10 text-white w-40">
              <DropdownMenuItem 
                className="cursor-pointer focus:bg-purple-500/10 focus:text-purple-300" 
                onClick={() => router.push(`/dashboard/create?id=${series.id}`)}
              >
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
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
          <AlertDialogContent className="bg-[#1a1a20] border-white/10 rounded-2xl  text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/80 text-sm">
                This action cannot be undone. This will permanently delete the
                <strong> {series.series_name}</strong> series and all its associated data.
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
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[11px] h-9 border-white/10 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer gap-2"
            onClick={() => toast.info("Redirecting to video history...")}
          >
            <ClockHistory className="w-3.5 h-3.5" />
            View History
          </Button>
          <Button
            size="sm"
            className="flex-1 text-[11px] h-9 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer gap-2"
            onClick={triggerGeneration}
          >
            <Sparkles className="w-3.5 h-3.5 text-white/80" />
            Trigger Now
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function ClockHistory(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
