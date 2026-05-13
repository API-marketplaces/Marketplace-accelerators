"use client";
import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConciergeBubbleProps {
  fileId?: string | number;
}

export default function ConciergeBubble({ fileId }: ConciergeBubbleProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: fileId
        ? "👋 Hi! Ask me anything about this dashboard — top clients, errors, revenue opportunities, or monetization strategy!"
        : "👋 Hi! I'm your AI Concierge. Ask me anything about API monetization!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const url = fileId ? `/api/concierge?fileId=${fileId}` : `/api/concierge`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions((data.suggestions || []).slice(0, 4));
      } catch {
        setSuggestions([
          "What are my top APIs?",
          "Which clients have the most errors?",
          "How can I monetize better?",
          "Summarize my API performance",
        ]);
      }
    };
    fetchSuggestions();
  }, [fileId]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages,
          file_id: fileId ? parseInt(String(fileId)) : null,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        role: "assistant",
        content: data.response || "Sorry, I couldn't respond. Please try again.",
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (!open) setUnread((u) => u + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <p key={i} className="flex gap-1.5 mt-0.5">
            <span className="text-blue-400">•</span>
            <span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </p>
        );
      }
      if (line.trim() === "") return <br key={i} />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="mt-0.5">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {open && (
        <div className="w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          style={{ height: "460px" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">AI Concierge</p>
                <p className="text-blue-200 text-xs mt-0.5">Powered by Groq Llama 3</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed
                  ${msg.role === "assistant"
                    ? "bg-white/8 border border-white/8 text-slate-200"
                    : "bg-blue-600 text-white"}`}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white/8 border border-white/8 rounded-xl px-3 py-2">
                  <div className="flex gap-1 items-center h-3">
                    {[0, 150, 300].map((delay) => (
                      <div key={delay} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (shown only at start) */}
          {messages.length <= 1 && suggestions.length > 0 && !loading && (
            <div className="px-3 pb-2 flex-shrink-0">
              <p className="text-slate-500 text-xs mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Try asking:
              </p>
              <div className="flex flex-col gap-1">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="text-left text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10
                      border border-white/8 rounded-lg px-2.5 py-1.5 transition-all truncate">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 px-3 py-2.5 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your data..."
              disabled={loading}
              className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white
                placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors"
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="w-7 h-7 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed
                rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300
          ${open
            ? "bg-slate-700 hover:bg-slate-600"
            : "bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-110"
          } relative`}
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <Bot className="w-6 h-6 text-white" />
        }
        {/* Unread badge */}
        {unread > 0 && !open && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{unread}</span>
          </div>
        )}
        {/* Pulse ring when closed */}
        {!open && (
          <div className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping" />
        )}
      </button>
    </div>
  );
}