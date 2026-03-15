"use client";

import {
  Plus,
  MessageSquare,
  Settings,
  CircleHelp,
  Trash2,
  Share,
  Pencil,
  Pin,
} from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { HiDotsHorizontal } from "react-icons/hi";

import { useSelector, useDispatch } from "react-redux";

import {
  selectChats,
  selectCurrentChatId,
  switchChat,
} from "@/app/store/chat-slice/chat";

import {
  deleteChatById,
  renameChat,
  pinChat,
  shareChat,
} from "@/app/store/chathistory-slice/chathistory";

interface AppSidebarProps {
  onNewChat?: () => void;
}

export function AppSidebar({ onNewChat }: AppSidebarProps) {
  const dispatch = useDispatch<any>();
  const chats = useSelector(selectChats);
  const currentChatId = useSelector(selectCurrentChatId);

  return (
    <Sidebar className="border-r-0">
      {/* HEADER */}
      <SidebarHeader className="p-4 pt-6">
        <Button
          variant="outline"
          onClick={onNewChat}
          className="w-full justify-start cursor-pointer gap-3 rounded-full h-11 px-4 bg-transparent border-border hover:bg-muted/50"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">New chat</span>
        </Button>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2 py-4">
            Recent
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  No chats yet
                </p>
              ) : (
                [...chats].reverse().map((chat) => (
                  <SidebarMenuItem key={chat.id} className="group/menu-item">
                    <SidebarMenuButton
                      variant="default"
                      isActive={chat.id === currentChatId}
                      onClick={() => dispatch(switchChat(chat.id))}
                      className="w-full justify-start gap-3 rounded-xl cursor-pointer px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors data-[active=true]:bg-muted/60 data-[active=true]:text-foreground"
                    >
                      <div className="flex justify-between items-center gap-2 w-full pr-1">
                        {/* CHAT TITLE */}
                        <span className="truncate text-sm flex gap-2 items-center flex-1 min-w-0">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </span>

                        {/* DROPDOWN */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div
                              className="relative opacity-0 group-hover/menu-item:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted cursor-pointer shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <HiDotsHorizontal />
                            </div>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            side="right"
                            sideOffset={6}
                            className="w-48"
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(shareChat(chat.id));
                              }}
                            >
                              <Share className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(
                                  renameChat({
                                    chatId: chat.id,
                                    title: "New Title",
                                  }),
                                );
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(pinChat(chat.id));
                              }}
                            >
                              <Pin className="mr-2 h-4 w-4" />
                              Pin
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(deleteChatById(chat.id));
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/help" className="w-full">
              <SidebarMenuButton
                variant="default"
                className="w-full justify-start gap-3 rounded-xl px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                asChild
              >
                <div>
                  <CircleHelp className="h-4 w-4 shrink-0" />
                  <span>Help</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              variant="default"
              className="w-full justify-start gap-3 rounded-xl px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
