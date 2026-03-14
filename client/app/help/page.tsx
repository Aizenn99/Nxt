"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="w-full md:p-6 p-2 bg-black text-foreground font-geist-mono selection:bg-purple-500/30">
      <div className=" mx-auto px-6 py-12 space-y-16">
        {/* Header */}
        <header className="space-y-4">
          <Button
            variant="ghost"
            asChild
            className="mb-8 hover:bg-white/5 -ml-4"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Link>
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent">
            Help & Documentation
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Everything you need to know about navigating NxtAi, utilizing our
            distinct AI models, and understanding how your data is handled.
          </p>
        </header>

        {/* Models Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-semibold">
              Which Model should I use?
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-muted/30 border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <CardTitle>Groq (Llama 3)</CardTitle>
                </div>
                <CardDescription>Best for Speed & General Chat</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Running on Groq's lightning-fast hardware, Llama 3 excels at
                  everyday questions, coding assistance, and instantaneous
                  back-and-forth dialogue.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                  <li>Near-instant response times</li>
                  <li>Great for coding and creative writing</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className="w-5 h-5 text-blue-400" />
                  <CardTitle>Cohere (Command-A)</CardTitle>
                </div>
                <CardDescription>
                  Best for Complex Reasoning & RAG
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Cohere's models are heavily trained for enterprise tasks,
                  following incredibly specific instructions, and executing
                  rigorous logic.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
                  <li>Strong instruction following</li>
                  <li>Excellent at summarizing large texts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                  <CardTitle>Hugging Face (Vision)</CardTitle>
                </div>
                <CardDescription>Best for Text-to-Image</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  NxtAi connects to Stable Diffusion XL via Hugging Face. To
                  generate an image, simply start your message with{" "}
                  <code className="bg-white/10 px-1 py-0.5 rounded">
                    /image
                  </code>{" "}
                  and type your prompt.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-green-400" />
                  <CardTitle>Fal AI (Kling)</CardTitle>
                </div>
                <CardDescription>Best for Text-to-Video</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  NxtAi leverages Kling Video models via Fal AI. To generate a
                  short video, start your message with{" "}
                  <code className="bg-white/10 px-1 py-0.5 rounded">
                    /video
                  </code>{" "}
                  and type your scene description.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Privacy Policy Section */}
        <section className="space-y-6 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-semibold">Privacy Policy</h2>
          </div>
          <div className="prose prose-invert max-w-none text-sm text-muted-foreground space-y-6">
            <p>
              At NxtAi, we prioritize your security and data transparency.
              Because this application acts as an aggregator for various
              third-party AI models (Groq, Cohere, DeepSeek, OpenRouter, Fal-AI,
              and Hugging Face), it is important to understand how your data
              flows.
            </p>

            <div>
              <h3 className="text-foreground text-lg font-medium mb-2">
                1. Local Credentials
              </h3>
              <p>
                Your API Keys remain entirely under your control. The NxtAi
                server processes them securely via environment variables to
                fulfill server-side API requests, preventing your keys from
                being exposed to the client-side browser.
              </p>
            </div>

            <div>
              <h3 className="text-foreground text-lg font-medium mb-2">
                2. Chat History & Database
              </h3>
              <p>
                Your chat logs and history are saved to your configured MongoDB
                database. This allows NxtAi to sync your conversations across
                devices ensuring you never lose context.
              </p>
            </div>

            <div>
              <h3 className="text-foreground text-lg font-medium mb-2">
                3. Third-Party Data Processing
              </h3>
              <p>
                When you submit a prompt to NxtAi, that text is sent directly to
                the model provider you have currently selected. They process the
                prompt to stream a response back to you.
                <br />
                <br />
                <strong>Please Note:</strong> Your chat data is subject to the
                respective privacy policies of these providers. Some providers
                may retain logs for 30 days for abuse monitoring, while others
                explicitly do not train on API data. We recommend reviewing the
                standard API Privacy Agreements from Groq, Cohere, DeepSeek,
                OpenRouter, Fal-AI, and HuggingFace for complete assurance
                regarding model training practices.
              </p>
            </div>
          </div>
        </section>

        <footer className="pt-12 pb-8 text-center text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} NxtAi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
