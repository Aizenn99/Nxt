"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Send, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  HelpCircle, 
  UserRound, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  X,
  ArrowLeft,
  Link as LinkIcon,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { 
  selectCurrentChat, 
  addMessage, 
  startNewOrchestratorChat,
  syncChatHistory 
} from "@/app/store/chat-slice/chat";

const VideoCall = dynamic(() => import("@/components/videocall"), {
  ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Download } from "lucide-react";

interface Action {
  type: "explain_text" | "generate_image" | "generate_video" | "start_live_agent";
  input?: string;
  reason?: string;
  status?: "pending" | "running" | "completed" | "failed";
  result?: any;
  links?: { label: string; url: string; }[];
}

interface AutomationPlan {
  topic: string;
  level: string;
  actions: Action[];
}

function GeminiImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = src;
    link.download = `${alt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "image"}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative group rounded-2xl overflow-hidden cursor-zoom-in my-3 border border-white/10 max-w-md w-full shadow-2xl transition-all hover:ring-2 ring-primary/50">
          <img src={src} alt={alt} className="w-full h-auto object-cover max-h-[400px]" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 pointer-events-none">
            <button onClick={handleDownload} className="pointer-events-auto p-2 bg-black/50 hover:bg-black text-white rounded-full backdrop-blur-md transition-all">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="border-none bg-transparent shadow-none w-[90vw] max-w-7xl p-0 flex flex-col items-center justify-center overflow-visible">
        <div className="relative flex flex-col items-center w-full">
          <div className="absolute -top-14 right-0 flex gap-3">
            <button onClick={handleDownload} className="p-2 bg-black/50 hover:bg-black text-white rounded-full transition-all backdrop-blur-md border border-white/10">
              <Download className="w-5 h-5" />
            </button>
            <DialogClose className="p-2 bg-black/50 hover:bg-black text-white rounded-full transition-all backdrop-blur-md border border-white/10 focus:outline-none">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
          <img src={src} alt={alt} className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl ring-1 ring-white/10" />
          {alt && <p className="text-white/70 text-sm mt-4 px-4 py-1 bg-black/40 rounded-full backdrop-blur-sm">{alt}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PersistentImage({ imageId, prompt }: { imageId: string; prompt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/images/${imageId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.image?.imageUrl) setSrc(d.image.imageUrl); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [imageId]);

  if (loading) return <div className="w-64 h-64 rounded-3xl bg-white/5 animate-pulse border border-white/10 my-3" />;

  if (!src) return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/40 text-sm my-3 max-w-sm">
      <AlertCircle className="w-4 h-4" /><span>Image unavailable</span>
    </div>
  );

  return (
    <div className="my-2 flex flex-col">
      <GeminiImage src={src} alt={prompt} />
      <p className="text-[10px] text-white/30 font-medium ml-1">Prompt: {prompt}</p>
    </div>
  );
}

function ResourceLinks({ links, fallbackQuery }: { links?: { label: string; url: string; }[], fallbackQuery?: string }) {
  const displayLinks = links && links.length > 0 ? links : (
    fallbackQuery ? [{ label: `Search Google: ${fallbackQuery.slice(0, 30)}...`, url: `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}` }] : []
  );

  if (displayLinks.length === 0) return null;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
        <LinkIcon className="w-3 h-3" /> Related Resources
      </div>
      <div className="flex flex-wrap gap-2">
        {displayLinks.map((link, idx) => (
          <div 
            key={idx}
            className="group flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden transition-all hover:border-white/20"
          >
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {link.label}
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <button 
              onClick={() => copyToClipboard(link.url)}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/30 hover:text-white border-l border-white/10 transition-colors"
              title="Copy link"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultRenderer({ result }: { result: any }) {
  if (!result || typeof result !== "string") return <div className="text-white/80">{String(result)}</div>;

  // Handle Image format [image|||ID|||prompt]
  const imageMatch = result.match(/\[image\|\|\|([a-f0-9]+)\|\|\|([\s\S]+)\]/);
  const legacyImageMatch = result.match(/\[image:([a-f0-9]{24}):([\s\S]+)\]/);
  const match = imageMatch || legacyImageMatch;

  if (match) {
    const imageId = match[1];
    const prompt = match[2];
    return (
        <div className="space-y-1">
            <div className="text-purple-400 flex items-center gap-2 font-bold text-sm">
                <ImageIcon className="w-4 h-4"/> Visual Output
            </div>
            <PersistentImage imageId={imageId} prompt={prompt} />
        </div>
    );
  }

  // Handle Video format ![video:prompt](url)
  const videoMatch = result.match(/!\[video:([^\]]*)\]\(([^)]+)\)/);
  if (videoMatch) {
    const url = videoMatch[2];
    return (
      <div className="space-y-3">
        <video src={url} controls className="rounded-2xl w-full max-w-md border border-white/10 shadow-2xl" />
        <div className="text-green-400 text-xs flex items-center gap-2 font-bold">
            <Video className="w-3 h-3"/> Video synchronized
        </div>
      </div>
    );
  }

  // Handle RAW image markdown ![prompt](data:image...)
  const rawImageMatch = result.match(/!\[([^\]]*)\]\((data:image[^)]+)\)/);
  if (rawImageMatch) {
    return (
      <div className="space-y-1">
        <div className="text-purple-400 flex items-center gap-2 font-bold text-sm">
            <ImageIcon className="w-4 h-4"/> Visual Output
        </div>
        <GeminiImage src={rawImageMatch[2]} alt={rawImageMatch[1]} />
      </div>
    );
  }

  return <div className="leading-relaxed whitespace-pre-wrap text-white/80 text-[13px]">{result}</div>;
}

export default function OrchestratorPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentChat = useSelector(selectCurrentChat);

  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plan, setPlan] = useState<AutomationPlan | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallId, setVideoCallId] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load plan from history on mount or chat switch
  useEffect(() => {
    if (currentChat?.type === "orchestrator" && currentChat.messages.length > 0) {
      const lastAssistantMsg = [...currentChat.messages].reverse().find(m => m.role === "assistant" && m.content.startsWith("[plan]"));
      if (lastAssistantMsg) {
        try {
          const planData = JSON.parse(lastAssistantMsg.content.replace("[plan]", ""));
          setPlan(planData);
          const lastUserMsg = [...currentChat.messages].reverse().find(m => m.role === "user");
          if (lastUserMsg) setQuery(lastUserMsg.content);
        } catch (e) {
          console.error("Failed to parse plan from history", e);
        }
      }
    } else {
        // Reset if we switch to a chat that isn't an orchestrator or is empty
        if (currentChat?.type !== "orchestrator") {
            setPlan(null);
            setQuery("");
        }
    }
  }, [currentChat?.id]);

  const savePlanToHistory = (updatedPlan: AutomationPlan) => {
    if (!currentChat || currentChat.type !== "orchestrator") return;

    dispatch(addMessage({
      chatId: currentChat.id,
      message: {
        role: "assistant",
        content: `[plan]${JSON.stringify(updatedPlan)}`,
        timestamp: Date.now()
      }
    }));
    dispatch(syncChatHistory() as any);
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setQuery(e.currentTarget.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const analyzeQuery = async () => {
    if (!query.trim()) return;
    setIsAnalyzing(true);
    setPlan(null);

    try {
      let activeChatId = currentChat?.id;
      if (!currentChat || currentChat.type !== "orchestrator") {
        const newChatAction = await dispatch(startNewOrchestratorChat() as any);
        // The slice handles setting currentChatId, so we get it from there in the next tick
        // but for immediate use we might need more logic or just wait for effect
      }

      const response = await fetch("http://localhost:5000/api/agent/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Failed to analyze query");

      const data = await response.json();
      const newPlan = {
        ...data,
        actions: data.actions.map((a: Action) => ({ ...a, status: "pending" })),
      };
      setPlan(newPlan);
      
      // The actual saving usually happens after plan is set and we're in an orchestrator chat
    } catch (error) {
      console.error("Error analyzing query:", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger save when plan is first generated
  useEffect(() => {
      if (plan && currentChat?.type === "orchestrator" && currentChat.messages.length === 0) {
          dispatch(addMessage({
              chatId: currentChat.id,
              message: { role: "user", content: query, timestamp: Date.now() }
          }));
          savePlanToHistory(plan);
      }
  }, [plan]);

  const executeAction = async (index: number) => {
    if (!plan || !currentChat) return;
    
    const updatedActions = [...plan.actions];
    const action = updatedActions[index];
    action.status = "running";
    setPlan({ ...plan, actions: updatedActions });

    try {
      let result = "";
      if (action.type === "explain_text") {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: [{ role: "user", content: action.input }],
            model: "llama-3.3-70b-versatile"
          }),
        });
        const data = await res.json();
        result = data.reply;
      } else if (action.type === "generate_image") {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: [{ role: "user", content: `/image ${action.input}` }],
          }),
        });
        const data = await res.json();
        result = data.reply;
      } else if (action.type === "generate_video") {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: [{ role: "user", content: `/video ${action.input}` }],
          }),
        });
        const data = await res.json();
        result = data.reply;
      } else if (action.type === "start_live_agent") {
        const callId = `live-${Date.now()}`;
        
        // Notify backend to start the agent for this specific call
        try {
          await fetch("/api/agent/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              callId, 
              instructions: action.reason || "Prepare to assist the user with their automation roadmap."
            }),
          });
        } catch (err) {
          console.error("Failed to notify agent service:", err);
          toast.error("Agent failed to join the call, but you can still join.");
        }

        setVideoCallId(callId);
        setShowVideoCall(true);
        result = "Live session started";
      }

      action.result = result;
      action.status = "completed";
    } catch (error) {
      console.error("Action execution error:", error);
      action.status = "failed";
    }

    const finalPlan = { ...plan, actions: updatedActions };
    setPlan(finalPlan);
    savePlanToHistory(finalPlan);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "explain_text": return <HelpCircle className="w-5 h-5 text-blue-400" />;
      case "generate_image": return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case "generate_video": return <Video className="w-5 h-5 text-green-400" />;
      case "start_live_agent": return <UserRound className="w-5 h-5 text-orange-400" />;
      default: return <Plus className="w-5 h-5" />;
    }
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset className="bg-[#050505]">
        <div className="flex flex-col h-screen w-full text-foreground overflow-hidden font-geist-sans">
          {/* Header */}
          <header className="flex justify-between items-center p-4 shrink-0 border-b border-white/5 bg-black/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/")}
                className="rounded-xl hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Orchestrator
              </div>
            </div>
            <div className="flex items-center gap-3">
               <Button 
                  variant="outline" 
                  onClick={() => dispatch(startNewOrchestratorChat() as any)}
                  className="rounded-xl border-white/10 hover:bg-white/5 text-xs h-9 px-4 font-semibold"
               >
                 <Plus className="w-4 h-4 mr-2" /> New Session
               </Button>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full scrollbar-minimal">
            <div className="w-full space-y-8">
              {/* Query Section */}
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">Task Automation</h1>
                  <p className="text-white/40 text-[13px] font-medium tracking-wide">Break down any request into a multi-tool roadmap.</p>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-[2rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
                  <div className="relative flex flex-col rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-3 shadow-2xl">
                    <Textarea
                      ref={textareaRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onInput={handleInput}
                      placeholder="e.g. Help me understand quantum physics, show me an image and a short animation..."
                      className="border-none bg-transparent focus-visible:ring-0 text-[15px] resize-none min-h-[120px] p-4 placeholder:text-white/10"
                    />
                    <div className="flex justify-end p-2">
                      <Button 
                        onClick={analyzeQuery} 
                        disabled={isAnalyzing || !query.trim()}
                        className="rounded-2xl px-8 h-12 bg-white text-black hover:bg-white/90 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                      >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                        {isAnalyzing ? "Analyzing..." : "Generate Plan"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Section */}
              <AnimatePresence>
                {plan && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 pt-4"
                  >
                    <div className="flex items-center justify-between px-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase mb-1">Execution Roadmap</span>
                        <h2 className="text-xl font-bold text-white/90">{plan.topic}</h2>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 tracking-widest uppercase">
                        {plan.level}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {plan.actions.map((action, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="bg-white/[0.02] border-white/5 p-6 rounded-[2rem] overflow-hidden hover:bg-white/[0.04] transition-all group backdrop-blur-sm shadow-xl">
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex gap-5">
                                <div className="mt-1 p-3.5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-inner group-hover:border-white/20 transition-all">
                                  {getActionIcon(action.type)}
                                </div>
                                <div className="space-y-1">
                                  <h3 className="font-bold text-[15px] capitalize text-white/90">{action.type.replace('_', ' ')}</h3>
                                  <p className="text-white/30 text-[12.5px] leading-relaxed max-w-xl font-medium">{action.input || action.reason}</p>
                                </div>
                              </div>
                              
                              <div className="shrink-0">
                                  {action.status === "pending" && (
                                    <Button 
                                      onClick={() => executeAction(idx)} 
                                      className="rounded-xl px-5 h-11 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 transition-all font-bold shadow-lg"
                                    >
                                      <Play className="w-4 h-4 mr-2 fill-current" /> 
                                      {action.type === "start_live_agent" ? "Start Call" : "Run"}
                                    </Button>
                                  )}
                                  {action.status === "running" && (
                                    <div className="flex items-center gap-2 px-4 h-11 rounded-xl bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                                      <Loader2 className="w-4 h-4 animate-spin" /> {action.type === "start_live_agent" ? "Connecting..." : "In Progress"}
                                    </div>
                                  )}
                                  {action.status === "completed" && (
                                    <div className="flex items-center gap-2 px-4 h-11 rounded-xl bg-green-500/5 text-green-400 font-bold border border-green-500/10">
                                      {action.type === "start_live_agent" ? (
                                        <>
                                          <Video className="w-4 h-4" /> Call Active
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-4 h-4" /> Finished
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {action.status === "failed" && (
                                    <div className="flex items-center gap-2 px-4 h-11 rounded-xl bg-red-500/5 text-red-500 font-bold border border-red-500/10">
                                      <AlertCircle className="w-4 h-4" /> Failed
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-white/[0.03]">
                                <ResourceLinks links={action.links} fallbackQuery={action.input || action.reason} />
                              </div>

                            <AnimatePresence>
                              {action.result && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  className="mt-6 pt-6 border-t border-white/5"
                                >
                                  <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                                    <ResultRenderer result={action.result} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!plan && !isAnalyzing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-12">
                   <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 text-center space-y-4 hover:bg-white/[0.02] transition-colors">
                     <div className="p-4 rounded-full bg-purple-500/5 w-fit mx-auto border border-purple-500/10 mb-2">
                        <ImageIcon className="w-8 h-8 text-purple-400/80" />
                     </div>
                     <h4 className="font-bold text-lg">Multi-Modal Output</h4>
                     <p className="text-xs text-white/20 font-medium leading-relaxed">Describe complex visual requests and get coordinated images and videos automatically.</p>
                   </div>
                   <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 text-center space-y-4 hover:bg-white/[0.02] transition-colors">
                     <div className="p-4 rounded-full bg-orange-500/5 w-fit mx-auto border border-orange-500/10 mb-2">
                        <UserRound className="w-8 h-8 text-orange-400/80" />
                     </div>
                     <h4 className="font-bold text-lg">Live Intervention</h4>
                     <p className="text-xs text-white/20 font-medium leading-relaxed">If the task is highly technical, the orchestrator suggests a live agent session to guide you.</p>
                   </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Video Call Modal */}
        {showVideoCall && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setShowVideoCall(false)} />
            <div className="relative w-[95vw] h-[90vh] max-w-7xl rounded-[3rem] overflow-hidden border border-white/10 bg-black shadow-[0_0_100px_rgba(168,85,247,0.15)]">
              <div className="absolute top-6 right-6 z-[110]">
                <Button variant="ghost" size="icon" onClick={() => setShowVideoCall(false)} className="rounded-full bg-white/5 hover:bg-red-500 hover:text-white transition-all backdrop-blur-md">
                   <X className="w-5 h-5" />
                </Button>
              </div>
              <VideoCall callId={videoCallId} onClose={() => setShowVideoCall(false)} />
            </div>
          </div>
        )}
      </SidebarInset>
    </>
  );
}
