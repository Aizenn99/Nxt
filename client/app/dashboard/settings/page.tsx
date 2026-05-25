"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Youtube, 
  Instagram, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  RefreshCcw,
  ShieldAlert
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DashboardSidebar } from "../DashboardSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

// Configure base URL for backend based on env or default
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings/accounts`, { withCredentials: true });
      setAccounts(res.data);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    
    // Check for status in URL (from OAuth redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const platform = urlParams.get("platform");
    
    if (status === "success" && platform) {
      toast.success(`Successfully connected ${platform}!`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === "error") {
      toast.error("Failed to connect account. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = async (platform: "youtube" | "instagram") => {
    setLoading(platform);
    try {
      const res = await axios.get(`${API_BASE_URL}/social/${platform}/auth`, { withCredentials: true });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error(`Failed to initiate ${platform} connection.`);
      setLoading(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    setLoading(platform);
    try {
      await axios.delete(`${API_BASE_URL}/settings/account/${platform}`, { withCredentials: true });
      toast.success(`Disconnected ${platform} successfully.`);
      fetchAccounts();
    } catch (err) {
      toast.error(`Failed to disconnect ${platform}.`);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/settings/delete-user`, { withCredentials: true });
      toast.success("Account permanently deleted.");
      router.push("/auth/login");
    } catch (err) {
      toast.error("Failed to delete account.");
      setIsDeleting(false);
    }
  };

  const isConnected = (platform: string) => {
    return accounts.find(acc => acc.platform === platform);
  };

  const getAccountName = (platform: string) => {
    return accounts.find(acc => acc.platform === platform)?.platformName || "Connected";
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
        <DashboardSidebar />
        
        <SidebarInset className="flex flex-col flex-1 bg-transparent">
          <DashboardNavbar 
             title="Settings" 
             onRefresh={fetchAccounts}
             loading={loading !== null}
          />

          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12">
              
              {/* Header */}
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-purple-600/20 rounded-2xl border border-purple-500/30">
                  <Settings className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                  <p className="text-muted-foreground mt-1">Manage your account and platform integrations</p>
                </div>
              </div>

              <div className="grid gap-8">
                
                {/* Social Connections */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <ExternalLink className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-semibold">Social Connections</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* YouTube Card */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden rounded-3xl transition-all hover:border-red-500/30 group">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
                            <Youtube className="w-6 h-6 text-red-500" />
                          </div>
                          {isConnected("youtube") ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 gap-1 px-3">
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-white/10 text-zinc-500">Not Linked</Badge>
                          )}
                        </div>
                        <CardTitle className="mt-4 text-xl">YouTube</CardTitle>
                        <CardDescription className="text-zinc-400">Connect to publish videos directly to your channel.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isConnected("youtube") && (
                          <div className="text-sm font-medium text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                            @{getAccountName("youtube")}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="bg-white/[0.02] border-t border-white/5 p-4">
                        {isConnected("youtube") ? (
                          <Button 
                            variant="ghost" 
                            className="w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-11"
                            onClick={() => handleDisconnect("youtube")}
                            disabled={loading === "youtube"}
                          >
                            {loading === "youtube" ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Disconnect Channel
                          </Button>
                        ) : (
                          <Button 
                            className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl h-11 shadow-lg shadow-red-600/20"
                            onClick={() => handleConnect("youtube")}
                            disabled={loading === "youtube"}
                          >
                            {loading === "youtube" ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : "Connect YouTube"}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>

                    {/* Instagram Card */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden rounded-3xl transition-all hover:border-pink-500/30 group">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-pink-500/10 rounded-xl group-hover:scale-110 transition-transform">
                            <Instagram className="w-6 h-6 text-pink-500" />
                          </div>
                          {isConnected("instagram") ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 gap-1 px-3">
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-white/10 text-zinc-500">Not Linked</Badge>
                          )}
                        </div>
                        <CardTitle className="mt-4 text-xl">Instagram</CardTitle>
                        <CardDescription className="text-zinc-400">Sync with your Instagram Professional account.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isConnected("instagram") && (
                          <div className="text-sm font-medium text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                            @{getAccountName("instagram")}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="bg-white/[0.02] border-t border-white/5 p-4">
                        {isConnected("instagram") ? (
                          <Button 
                            variant="ghost" 
                            className="w-full text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl h-11"
                            onClick={() => handleDisconnect("instagram")}
                            disabled={loading === "instagram"}
                          >
                            {loading === "instagram" ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Disconnect Account
                          </Button>
                        ) : (
                          <Button 
                            className="w-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white rounded-xl h-11 shadow-lg"
                            onClick={() => handleConnect("instagram")}
                            disabled={loading === "instagram"}
                          >
                            {loading === "instagram" ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : "Connect Instagram"}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>

                  </div>
                </section>

                {/* Danger Zone */}
                <section className="pt-10 border-t border-white/10">
                  <div className="flex items-center gap-2 px-1 mb-6 text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                    <h2 className="text-xl font-semibold">Danger Zone</h2>
                  </div>
                  
                  <Card className="bg-red-500/5 border-red-500/20 rounded-3xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-red-400">Permanent Deletion</CardTitle>
                      <CardDescription className="text-zinc-400">
                        Once you delete your account, there is no going back. All your connected platforms, video settings, and profile data will be erased forever.
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="bg-red-500/5 p-6 border-t border-red-500/10">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-8">
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400 text-base">
                              This action cannot be undone. This will permanently delete your account
                              and remove all your connected social platforms from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-white border-none rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-500 text-white border-none rounded-xl"
                              onClick={handleDeleteAccount}
                            >
                              {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                </section>

              </div>
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
