import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Trash2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { chatWithAssistant } from "@/lib/ai.functions";
import { Markdown } from "@/components/Markdown";
import { AiDisclaimer } from "@/components/AiDisclaimer";
import { addActivity } from "@/lib/activity";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Assistant — WorkMate AI" },
      { name: "description", content: "Chat with your workplace productivity AI assistant." },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const STORAGE = "workmate-chat";

const SUGGESTIONS = [
  "Help me write a polite follow-up to a client who hasn't replied in 5 days.",
  "Suggest 3 ways to run a more focused 30-minute team standup.",
  "Summarize the pros and cons of switching from weekly to daily check-ins.",
  "How should I prioritize when everything feels urgent?",
];

function ChatPage() {
  const chat = useServerFn(chatWithAssistant);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await chat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: r.text }]);
      if (next.length === 1) addActivity({ module: "chat", title: content.slice(0, 60) });
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat failed");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE);
    inputRef.current?.focus();
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Workplace AI Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Ask anything about productivity, planning, writing, or workplace decisions.
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clear}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear chat
          </Button>
        )}
      </div>

      <Card className="flex flex-col h-[calc(100vh-260px)] min-h-[500px]">
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="font-semibold mb-1">How can I help you today?</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Try one of these prompts or ask anything.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 w-full">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm p-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                  {m.role === "user" ? (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[90%]">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> WorkMate AI
                      </div>
                      <Markdown text={m.content} />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
              </div>
            )}
          </div>
          <div className="border-t border-border p-4 space-y-2">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Message WorkMate AI..."
                className="resize-none min-h-10 max-h-40"
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <AiDisclaimer />
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
