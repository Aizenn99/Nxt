"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  ListVideo,
  Video,
  BookText,
  Sparkles,
  LayoutDashboard,
  MessageSquare
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: any) => state.auth.user);

  const menuItems = [
    {
      label: "Text To Video",
      icon: Sparkles,
      href: "/dashboard/create",
      isActive: pathname === "/dashboard/create"
    },
    {
      label: "My Series",
      icon: ListVideo,
      href: "/dashboard",
      isActive: pathname === "/dashboard"
    },
    {
      label: "All Videos",
      icon: Video,
      href: "/dashboard/videos",
      isActive: pathname === "/dashboard/videos"
    },
    {
      label: "Usage Guides",
      icon: BookText,
      href: "/dashboard/guides",
      isActive: pathname === "/dashboard/guides"
    },
    {
      label: "Back To Chat",
      icon: MessageSquare,
      href: "/",
      isActive: pathname === "/"
    }
  ];

  return (
    <Sidebar className="border-r border-white/10 bg-[#0a0a0c]">
      <SidebarHeader className="p-6 border-b border-white/10">


        <Button
          className={`w-full gap-3 rounded-xl shadow-lg transition-all font-medium h-10 cursor-pointer
            ${pathname === "/dashboard/create"
              ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
              : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"}`}
          onClick={() => router.push("/dashboard/create")}
        >
          <Plus className="w-4 h-4" />
          Create New Series
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={() => router.push(item.href)}
                  className={`gap-4 rounded-xl h-11 transition-all cursor-pointer
                    ${item.isActive
                      ? "bg-white/5 text-purple-400 font-medium"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                >
                  <item.icon className={`w-5 h-5 ${item.isActive ? "text-purple-400" : ""}`} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>


      </SidebarContent>

      <div className=" p-6 border-t border-white/10">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
          <Avatar className="h-9 w-9 border border-white/10 group-hover:border-purple-500/30 transition-all">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xs font-bold">
              {user?.name?.substring(0, 2).toUpperCase() || "AI"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-all">
              {user?.name || "User"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
