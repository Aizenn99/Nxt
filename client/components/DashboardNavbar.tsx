"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  LogOut, 
  User, 
  Settings, 
  Sparkles,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { logoutUser } from "@/app/store/auth-slice/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DashboardNavbarProps {
  title: string;
  showSearch?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  backButtonHref?: string;
}

export function DashboardNavbar({
  title,
  showSearch = false,
  searchQuery = "",
  setSearchQuery,
  onRefresh,
  loading = false,
  backButtonHref
}: DashboardNavbarProps) {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const user = useSelector((state: any) => state.auth.user);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      router.push("/");
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between px-8 border-b border-white/5 bg-[#0a0a0c]/50 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-white/60 hover:text-white cursor-pointer transition-colors" />
        <div className="flex items-center gap-2">
          {backButtonHref && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg hover:bg-white/5 mr-2"
              onClick={() => router.push(backButtonHref)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {title}
          </h2>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Search Input (Conditional) */}
        {showSearch && setSearchQuery && (
          <div className="relative w-64 hidden md:block group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 to-purple-500/0 rounded-xl group-focus-within:from-purple-500/20 group-focus-within:to-blue-500/20 transition-all duration-500" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
            <Input 
              placeholder={`Search ${title.toLowerCase()}...`} 
              className="relative bg-white/5 border-white/10 h-9 pl-9 rounded-xl focus:border-purple-500/50 transition-all text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Refresh Action */}
          {onRefresh && (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all hidden sm:flex"
              onClick={onRefresh}
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground transition-all ${loading ? "animate-spin text-purple-400" : ""}`} />
            </Button>
          )}

          {/* Credits Display */}
          {user?.credits !== undefined && (
            <div className="hidden lg:flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-200">
                {user.credits} <span className="text-purple-400/60 font-medium">Credits</span>
              </span>
            </div>
          )}

          {/* User Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-xl p-0 hover:bg-white/5 ring-1 ring-white/10 transition-all hover:ring-purple-500/30">
                <Avatar className="h-full w-full rounded-xl">
                  <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-purple-600/20 text-purple-400 text-xs font-bold rounded-xl shadow-inner">
                    {user?.name?.substring(0, 2).toUpperCase() || "AI"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mt-2 bg-[#0d0d0f] border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-white">{user?.name || "User Account"}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuGroup className="p-1">
                <DropdownMenuItem 
                  className="flex items-center gap-3 p-2 rounded-xl focus:bg-white/5 cursor-pointer transition-all"
                  onClick={() => router.push("/")}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Back to Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-2 rounded-xl focus:bg-white/5 cursor-pointer transition-all">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-2 rounded-xl focus:bg-white/5 cursor-pointer transition-all">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-2 rounded-xl focus:bg-white/5 cursor-pointer transition-all">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/5" />
              <div className="p-1">
                <DropdownMenuItem 
                  className="flex items-center gap-3 p-2 rounded-xl focus:bg-red-500/10 text-red-400 focus:text-red-300 cursor-pointer transition-all"
                  onClick={handleLogout}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-400/5">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
