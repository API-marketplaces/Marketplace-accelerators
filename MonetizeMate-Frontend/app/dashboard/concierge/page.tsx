"use client";
import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Bot, User, Sparkles, Database, RefreshCw, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function ConciergePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: fileId
        ? "👋 Hello! I'm your AI Concierge. I can see you've loaded a data file — I'm ready to answer questions about your API usage, clients, revenue, and monetization strategy. What would you like to know?"
        : "👋 Hello! I'm your AI Concierge for MonetizeMate. I can help you understand API monetization strategies, analyze usage patterns, and identify revenue opportunities.\n\n💡 **Tip:** Go to the Upload page and load a data file, then come back here for personalized insights!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const url = fileId
          ? `/api/concierge?fileId=${fileId}`
          : `/api/concierge`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [fileId]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history,
          file_id: fileId ? parseInt(fileId) : null,
        }),
      });

      const data = await res.json();
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "Sorry, I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Connection error. Please check your backend is running and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared! How can I help you?",
      timestamp: new Date(),
    }]);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    return content.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <p key={i} className="flex gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </p>
        );
      }
      if (line.trim() === "") return <br key={i} />;
      // Replace **bold** inline
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg leading-none">AI Concierge</h1>
                <p className="text-blue-300 text-xs mt-0.5">Powered by Groq Llama 3</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {fileId && (
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1.5">
                <Database className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-300 text-xs font-medium">File #{fileId} loaded</span>
              </div>
            )}
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
                ${msg.role === "assistant"
                  ? "bg-gradient-to-br from-blue-500 to-purple-600"
                  : "bg-gradient-to-br from-slate-600 to-slate-700"
                }`}>
                {msg.role === "assistant"
                  ? <Bot className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-1
                  ${msg.role === "assistant"
                    ? "bg-white/10 backdrop-blur-sm border border-white/10 text-slate-100"
                    : "bg-blue-600 text-white"
                  }`}>
                  {renderContent(msg.content)}
                </div>
                <span className="text-slate-500 text-xs px-1">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length <= 2 && !loading && (
        <div className="px-4 pb-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-slate-400 text-xs mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 5).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="text-xs bg-white/8 hover:bg-white/15 border border-white/10 hover:border-blue-400/50
                    text-slate-300 hover:text-white rounded-full px-3 py-1.5 transition-all duration-200 text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 bg-white/5 backdrop-blur-md px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-white/10 border border-white/15 hover:border-blue-400/50 focus-within:border-blue-400/70
              rounded-2xl transition-all duration-200 overflow-hidden">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your API data..."
                rows={1}
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm px-4 py-3
                  resize-none outline-none leading-relaxed"
                style={{ minHeight: "44px", maxHeight: "120px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
                disabled={loading}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700
                disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200
                shadow-lg hover:shadow-blue-500/25 flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
export default function ConciergePage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#060E1E',display:'flex',alignItems:'center',justifyContent:'center',color:'#00E5C0'}}>Loading…</div>}>
      <ConciergePageInner />
    </Suspense>
  )
}