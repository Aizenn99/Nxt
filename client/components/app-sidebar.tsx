import {
  Plus,
  MessageSquare,
  Settings,
  CircleHelp,
  Trash2,
  Share,
  Pencil,
  Pin,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
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
  deleteChatById,
  renameChat,
  pinChat,
  shareChat,
} from "@/app/store/chat-slice/chat";

import { toast } from "sonner";

interface AppSidebarProps {
  onNewChat?: () => void;
}

export function AppSidebar({ onNewChat }: AppSidebarProps) {
  const dispatch = useDispatch<any>();
  const chats = useSelector(selectChats);
  const currentChatId = useSelector(selectCurrentChatId);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const pinnedChats = chats.filter((chat) => chat.pinned);
  const recentChats = chats.filter((chat) => !chat.pinned);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const handleRename = (chatId: string, title: string) => {
    setEditingChatId(chatId);
    setEditTitle(title);
  };

  const submitRename = async () => {
    if (!editingChatId) return;
    if (editTitle.trim() === "") {
      setEditingChatId(null);
      return;
    }

    try {
      await dispatch(
        renameChat({
          chatId: editingChatId,
          title: editTitle.trim(),
        }),
      ).unwrap();
      toast.success("Chat renamed");
    } catch {
      toast.error("Failed to rename chat");
    } finally {
      setEditingChatId(null);
    }
  };

  const cancelRename = () => {
    setEditingChatId(null);
  };

  const renderChatItem = (chat: any) => (
    <SidebarMenuItem key={chat.id} className="group/menu-item">
      <SidebarMenuButton
        variant="default"
        isActive={chat.id === currentChatId}
        onClick={() => {
          if (editingChatId !== chat.id) {
            dispatch(switchChat(chat.id));
          }
        }}
        className="w-full justify-start gap-3 rounded-xl cursor-pointer px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors data-[active=true]:bg-muted/60 data-[active=true]:text-foreground"
      >
        <div className="flex justify-between items-center gap-2 w-full pr-1 overflow-hidden">
          {/* CHAT TITLE OR EDIT INPUT */}
          <div className="truncate text-sm flex gap-2 items-center flex-1 min-w-0">
            <MessageSquare className="h-4 w-4 shrink-0" />
            {editingChatId === chat.id ? (
              <div
                className="flex items-center gap-1 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={editInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  className="bg-background border border-border rounded px-1 py-0.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    submitRename();
                  }}
                  className="p-1 hover:bg-muted rounded text-green-600"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelRename();
                  }}
                  className="p-1 hover:bg-muted rounded text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span className="truncate">{chat.title}</span>
            )}
          </div>

          {/* ICONS & DROPDOWN */}
          {!editingChatId && (
            <div className="flex items-center shrink-0">
              {/* PIN ICON (VISIBLE ONLY IF PINNED AND NOT HOVERED) */}
              {chat.pinned && (
                <Pin className="h-3.5 w-3.5 text-muted-foreground/50 group-hover/menu-item:hidden transition-all fill-muted-foreground/20" />
              )}

              {/* DROPDOWN (VISIBLE ON HOVER) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    className="relative opacity-0 group-hover/menu-item:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted cursor-pointer shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HiDotsHorizontal className="h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  side="right"
                  sideOffset={6}
                  className="w-48"
                >
                  {/* SHARE */}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const result = await dispatch(
                          shareChat(chat.id),
                        ).unwrap();
                        if (result?.shareUrl) {
                          await navigator.clipboard.writeText(result.shareUrl);
                          toast.success("Share link copied to clipboard");
                        }
                      } catch {
                        toast.error("Failed to share chat");
                      }
                    }}
                  >
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>

                  {/* RENAME */}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(chat.id, chat.title);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>

                  {/* PIN / UNPIN */}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(pinChat(chat.id));
                    }}
                  >
                    <Pin className="mr-2 h-4 w-4" />
                    {chat.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>

                  {/* DELETE */}
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deleteChatById(chat.id))
                        .unwrap()
                        .then(() => toast.success("Chat deleted successfully"))
                        .catch(() => toast.error("Failed to delete chat"));
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

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
        {/* PINNED SECTION */}
        {pinnedChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2 py-4">
              Pinned
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[...pinnedChats].reverse().map(renderChatItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* RECENT SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2 py-4">
            Recent
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.length === 0 && pinnedChats.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  No chats yet
                </p>
              ) : (
                [...recentChats].reverse().map(renderChatItem)
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
