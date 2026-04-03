"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mic,
  Paperclip,
  Send,
  UserCircle,
  Code,
  Image as ImageIcon,
  Video,
  FileText,
  Square,
  Camera,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useSelector, useDispatch } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  startNewChat,
  sendChatMessage,
  selectMessages,
  selectIsLoading,
  selectCurrentChat,
  fetchChatHistory,
  selectSelectedModel,
  setSelectedModel,
} from "@/app/store/chat-slice/chat";
import { logoutUser } from "@/app/store/auth-slice/auth";
import { ChatMessages } from "@/components/ChatMessages";

const VideoCall = dynamic(() => import("@/components/videocall"), {
  ssr: false,
});

const SUGGESTIONS = [
  {
    icon: <Code className="w-6 h-6 text-blue-400" />,
    text: "Write a React component",
  },
  {
    icon: <ImageIcon className="w-6 h-6 text-purple-400" />,
    text: "Generate a logo ",
  },
  {
    icon: <Video className="w-6 h-6 text-green-400" />,
    text: "Create a short video ",
  },
  {
    icon: <FileText className="w-6 h-6 text-orange-400" />,
    text: "Draft a project proposal",
  },
];

const MODELS = [
  { id: "gemini", name: "Gemini (2.5 flash)" },
  { id: "llama-3.3-70b-versatile", name: "Groq (Fast)" },
  { id: "cohere", name: "Cohere (Think)" },
  { id: "openrouter", name: "OpenRouter" },
];

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const messages = useSelector(selectMessages);
  const isLoading = useSelector(selectIsLoading);
  const currentChat = useSelector(selectCurrentChat);
  const selectedModel = useSelector(selectSelectedModel);

  const [input, setInput] = useState("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallId, setVideoCallId] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachments, setAttachments] = useState<{name: string, type: string, base64: string, preview?: string}[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentRequestRef = useRef<{ abort: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchChatHistory() as any);
    }
  }, [dispatch, isAuthenticated]);

  const resetTextarea = () => {
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setInput(e.currentTarget.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${e.currentTarget.scrollHeight}px`;
    }
  };

  const handleSend = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0 || isLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    resetTextarea();
    
    // Decouple attachments and string
    const attachedPayload = [...attachments];
    setAttachments([])

    const promise = dispatch(sendChatMessage({ userText: trimmed, attachments: attachedPayload }) as any);
    currentRequestRef.current = promise;
  };

  const handleStopGeneration = () => {
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      const newAttachment = {
        name: file.name,
        type: file.type || "application/octet-stream",
        base64: result,
        preview: file.type.startsWith("image/") ? result : undefined
      };
      
      setAttachments(prev => [...prev, newAttachment]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const prevInput = input;
        setInput((prev) => prev + (prev ? " " : "") + "(Transcribing audio...)");

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          
          setInput((current) => {
            // Remove the loading message and append actual text
            const withoutLoading = current.replace("(Transcribing audio...)", "").trim();
            if (data.text) {
              return withoutLoading + (withoutLoading && !withoutLoading.endsWith(" ") ? " " : "") + data.text.trim();
            } else if (data.error || data.details) {
              return withoutLoading + ` [STT Error: ${data.error || JSON.stringify(data)}]`;
            } else {
              return withoutLoading + " [No speech detected]";
            }
          });
        } catch (error: any) {
          console.error("Transcription error", error);
          setInput((current) => current.replace("(Transcribing audio...)", "").trim() + ` [Network Error: ${error.message}]`);
        } finally {
          setIsTranscribing(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Please enable microphone permissions.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function handleLogout() {
    console.log("handleLogout called in page.tsx");
    dispatch(logoutUser() as any)
      .unwrap()
      .then(() => {
        console.log("Logout successful, redirecting...");
        if (typeof window !== "undefined")
          localStorage.removeItem("currentChatId");
        router.push("/auth/login");
      })
      .catch((err: any) => {
        console.error("Logout failed in try-catch:", err);
      });
  }

  const handleStartVideoCall = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    const callId = `nxtai-${Date.now()}`;
    setVideoCallId(callId);
    setShowVideoCall(true);
  }, [isAuthenticated, router]);

  const handleEndVideoCall = useCallback(() => {
    setShowVideoCall(false);
    setVideoCallId("");
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <>
      <AppSidebar
        onNewChat={() => {
          // Only create a new chat if the current chat has been used
          const currentHasMessages =
            currentChat && currentChat.messages.length > 0;
          if (currentHasMessages || !currentChat) {
            dispatch(startNewChat());
          }
        }}
      />
      <SidebarInset className="bg-black cursor-pointer">
        <div className="flex flex-col font-geist-mono h-screen w-full text-foreground overflow-hidden">
          {/* Header */}
          <header className="flex justify-between items-center p-4 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                NxtAi
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 gap-1 font-medium text-muted-foreground hover:text-foreground"
                  >
                    {MODELS.find((m) => m.id === selectedModel)?.name ||
                      "Select Model"}
                    <span className="text-xs opacity-50">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[180px] rounded-2xl "
                >
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => dispatch(setSelectedModel(model.id))}
                      className={
                        selectedModel === model.id
                          ? "bg-muted rounded-xl bg-white/10"
                          : "cursor-pointer"
                      }
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border shadow-sm">
                    <span className="text-primary">✨</span>
                    {user?.credits ?? 0} Credits
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar
                        className="w-9 h-9 cursor-pointer transition-all duration-200
  bg-muted/40 backdrop-blur-sm
  ring-1 ring-border
  hover:ring-primary/60
  hover:bg-muted/60
  hover:shadow-md hover:shadow-primary/20
  active:scale-95"
                      >
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-transparent text-foreground font-medium">
                          {user?.name ? (
                            user.name.charAt(0).toUpperCase()
                          ) : (
                            <UserCircle className="w-6 h-6 text-muted-foreground" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      side="bottom"
                      sideOffset={10}
                      className="w-40 mr-2 p-2 rounded-2xl"
                    >
                      <DropdownMenuLabel className="flex justify-center items-center">
                        {user?.name}
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem className="cursor-pointer rounded-xl hover:bg-white/10">
                        Settings
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer rounded-xl hover:bg-white/10"
                      >
                        <Link href="/help">Help</Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="cursor-pointer rounded-xl hover:bg-white/10"
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="outline" asChild className="ml-2">
                  <Link href="/auth/login">Login</Link>
                </Button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center overflow-hidden max-w-4xl mx-auto w-full relative">
            {hasMessages ? (
              <ChatMessages messages={messages} isLoading={isLoading} />
            ) : (
              /* Landing View */
              <div className="flex-1 flex flex-col justify-center p-4 md:p-8 mb-28 w-full">
                <div className="space-y-2 mb-12 flex flex-col pt-8">
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent pb-2">
                    Hello, Human
                  </h1>
                  <h2 className="text-4xl md:text-5xl font-semibold text-muted-foreground">
                    How can I help you today?
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {SUGGESTIONS.map((s) => (
                    <Card
                      key={s.text}
                      onClick={() => handleSend(s.text)}
                      className="p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer border flex flex-col gap-4 rounded-2xl select-none"
                    >
                      {s.icon}
                      <div className="text-sm font-medium">{s.text}</div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="w-full max-w-3xl absolute md:mr-4 bottom-0 py-4 px-4 bg-black rounded-xl">
              <div className="relative flex flex-col rounded-3xl border bg-muted/30 shadow-sm p-1 pr-4 transition-all focus-within:ring-1 focus-within:ring-border focus-within:bg-muted/50">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1 w-full">
                    {attachments.map((att, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden bg-muted/80 border flex items-center p-1.5 px-3">
                        {att.preview ? (
                          <img src={att.preview} alt={att.name} className="w-8 h-8 object-cover rounded mr-2" />
                        ) : (
                          <FileText className="w-5 h-5 text-muted-foreground mr-2" />
                        )}
                        <span className="text-xs font-medium truncate max-w-[120px]">{att.name}</span>
                        <button onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="ml-2 text-muted-foreground hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-end w-full">
                  <input
                    type="file"
                    accept="*"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 cursor-pointer rounded-full text-muted-foreground hover:text-foreground shrink-0"
                    title="Attach File / Media"
                    onClick={handleFileSelect}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex items-center justify-center mb-1 gap-1 mx-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Generate Image"
                    onClick={() => setInput((prev) => prev + "/image ")}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Generate Video"
                    onClick={() => router.push("/dashboard/create")}
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a prompt here..."
                  className="flex-1 border-none shadow-none focus-visible:ring-0 text-base px-2 resize-none min-h-[40px] max-h-[160px] py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  rows={1}
                />
                <div className="flex items-center gap-2 shrink-0 mb-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartVideoCall}
                    className="rounded-full cursor-pointer text-muted-foreground hover:text-foreground relative group"
                    title="Start AI Video Call"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleRecording}
                    disabled={isTranscribing}
                    className={`rounded-full cursor-pointer transition-colors ${
                      isRecording
                        ? "text-red-500 bg-red-500/10 animate-pulse hover:text-red-400"
                        : isTranscribing
                        ? "text-blue-400 animate-spin"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={isRecording ? "Stop Recording" : isTranscribing ? "Transcribing..." : "Start Voice Typing"}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  {isLoading ? (
                    <Button
                      size="icon"
                      onClick={handleStopGeneration}
                      className="rounded-full cursor-pointer bg-foreground text-background hover:bg-foreground/90"
                      title="Stop Generation"
                    >
                      <Square className="w-4 h-4 fill-current text-background" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      onClick={() => handleSend()}
                      disabled={!input.trim() && attachments.length === 0}
                      className="rounded-full cursor-pointer bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                NxtAi may display inaccurate info, so double-check its
                responses.
              </p>
            </div>
          </main>
        </div>

        {/* Video Call Modal */}
        {showVideoCall && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={handleEndVideoCall}
            />
            {/* Modal */}
            <div className="relative w-[95vw] h-[90vh] max-w-6xl rounded-3xl overflow-hidden border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl shadow-purple-500/10 animate-in fade-in zoom-in-95 duration-300">
              {/* Header bar */}
              <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-white/90">NxtAi Vision Agent</span>
                  <span className="text-xs text-white/40 font-mono">• Live</span>
                </div>
                <button
                  onClick={handleEndVideoCall}
                  className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 transition-all duration-200 group"
                  title="End Call"
                >
                  <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
              {/* Video Content */}
              <div className="h-full w-full">
                <VideoCall callId={videoCallId} onClose={handleEndVideoCall} />
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </>
  );
}
