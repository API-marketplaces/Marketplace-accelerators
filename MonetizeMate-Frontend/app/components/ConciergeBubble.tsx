"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, ChevronDown, HelpCircle, MessageSquare, Paperclip, Send, X } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
  canContactSupport?: boolean;
}

interface ConciergeBubbleProps {
  fileId?: string | number;
}

type HelpView = "chat" | "support";

const DEFAULT_SUGGESTIONS = [
  "How do I get started?",
  "What features are available?",
  "How do I get monetization recommendations?",
  "What does pricing model mean?",
];

const APPLICATIONS = [
  "MonetizeMate",
  "Strategy Advisor",
  "Account and Login",
];

function answerFromLocalKnowledge(question: string): string | null {
  const text = question.toLowerCase();

  // Getting Started
  if (text.includes("get started") || text.includes("getting started") || text.includes("first time") || text.includes("new")) {
    return "Welcome to MonetizeMate! Start with the Monetization Strategy Advisor to answer questions about your business and generate personalized API monetization recommendations. The dashboard currently focuses on strategy recommendations while the analytics and gateway features are paused.";
  }

  // Features Overview
  if (text.includes("features") || text.includes("what can i do") || text.includes("what can you help")) {
    return "MonetizeMate currently has one active feature:\n\nMonetization Strategy Advisor - Answer questions about your business and get personalized monetization strategy recommendations.\n\nAnalytics Workbench and AI Monetization Plugin are temporarily paused in the application.";
  }

  // Dashboard
  if (text.includes("dashboard")) {
    return "The Dashboard is your starting point. It currently shows quick access to Get Strategy Recommendations through the Monetization Strategy Advisor.";
  }

  // Analytics Workbench
  if (text.includes("analytics") || text.includes("workbench") || text.includes("performance") || text.includes("api stats") || text.includes("usage")) {
    return "Analytics Workbench is temporarily paused in the application. For now, use the Monetization Strategy Advisor to generate API monetization recommendations.";
  }

  // Strategy Advisor
  if (text.includes("strategy") || text.includes("recommendation") || text.includes("advisor")) {
    return "The Monetization Strategy Advisor helps you:\n- Answer questions about your business goals and constraints\n- Get personalized monetization strategy recommendations\n- Understand different approaches to API monetization\n- Develop a strategy tailored to your needs\n\nSimply answer the questionnaire and receive customized recommendations for your situation.";
  }

  // AI Monetization Plugin
  if (text.includes("plugin") || text.includes("gateway") || text.includes("connect") || text.includes("monetization plugin")) {
    return "AI Monetization Plugin is temporarily paused in the application. For now, use the Monetization Strategy Advisor for API monetization planning.";
  }

  // Pricing Models
  if (text.includes("pricing model") || text.includes("tiered") || text.includes("pay-per-use") || text.includes("freemium") || text.includes("subscription") || text.includes("hybrid")) {
    return "MonetizeMate recommends 5 main pricing models:\n\n💎 TIERED - Different feature tiers at different price points (good for diverse customer needs)\n\n🎯 PAY-PER-USE - Customers pay based on usage (fair, scales with value)\n\n🆓 FREEMIUM - Free tier + paid premium features (builds user base)\n\n📅 SUBSCRIPTION - Fixed monthly/yearly fee (predictable revenue)\n\n🔀 HYBRID - Combination of models (flexible, maximizes revenue)\n\nAsk for more details about any model!";
  }

  // Prediction Model
  if (text.includes("prediction") || text.includes("forecast") || text.includes("growth") || text.includes("predict")) {
    return "Prediction and growth tools are temporarily paused. The active workflow is the Monetization Strategy Advisor, which helps you choose a monetization model and next steps.";
  }

  // Upload/Data
  if (text.includes("upload") || text.includes("file") || text.includes("data") || text.includes("import")) {
    return "API data import and gateway connection workflows are temporarily paused. You can still use the Strategy Advisor to create recommendations from business inputs.";
  }

  // How to use features
  if (text.includes("how do i") || text.includes("how to") || text.includes("how can i")) {
    return "The active workflow is GET STRATEGY RECOMMENDATIONS: answer questions about your business in the Strategy Advisor and receive a personalized monetization strategy.";
  }

  // Terminology
  if (text.includes("what is") || text.includes("what does") || text.includes("mean") || text.includes("definition") || text.includes("term")) {
    if (text.includes("monetize") || text.includes("monetization")) {
      return "Monetization means turning something into revenue. API monetization is the process of generating income from your API by:\n- Charging for access\n- Implementing usage-based pricing\n- Creating tiered offerings\n- Setting up subscription models\n\nMonetizeMate helps you choose the best monetization strategy for your specific situation.";
    }
    if (text.includes("endpoint")) {
      return "An API endpoint is a specific URL in your API that serves a particular function. For example:\n- /users/profile - gets user profile\n- /data/analytics - returns analytics data\n\nMonetizeMate analyzes which endpoints are most used to help you price and monetize effectively.";
    }
    if (text.includes("client")) {
      return "A client is any application or user that uses your API. MonetizeMate helps you understand:\n- Who your top clients are\n- How much they use your API\n- What endpoints they access\n- Their growth patterns\n\nThis helps you set pricing that's fair and profitable.";
    }
    if (text.includes("usage")) {
      return "Usage refers to how much and how often an API is used. This includes:\n- Number of requests (calls) made\n- Data volume transferred\n- Number of active users/clients\n- Peak usage times\n\nMonetizeMate tracks usage patterns to recommend optimal pricing models.";
    }
    return "I can explain many terms! Ask about specific concepts like 'pricing models', 'endpoints', 'clients', or 'usage'.";
  }

  // Support
  if (text.includes("support") || text.includes("human") || text.includes("contact") || text.includes("help")) {
    return "I can help connect you with the support team. Switch to the 'Leave a message' tab, fill out your email and details, and the team will follow up soon.";
  }

  // Default helpful response
  if (text.includes("hi") || text.includes("hello") || text.includes("hey")) {
    return "Hi there! I'm MateAI, your MonetizeMate assistant. I can help you get started with the Monetization Strategy Advisor and answer questions about API monetization strategy. What would you like to know?";
  }

  return null;
}

export default function ConciergeBubble({ fileId }: ConciergeBubbleProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<HelpView>("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm MateAI 👋 Ask me anything about MonetizeMate - I can help you get started, use the Strategy Advisor and answer questions about API monetization strategy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportApplication, setSupportApplication] = useState("MonetizeMate");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
  const [supportSending, setSupportSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && view === "chat") {
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, view]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const url = fileId ? `/api/concierge?fileId=${fileId}` : `/api/concierge`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const nextSuggestions = (data.suggestions || []).slice(0, 3);
        setSuggestions(nextSuggestions.length ? ["What is MonetizeMate?", ...nextSuggestions] : DEFAULT_SUGGESTIONS);
      } catch {
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
    };

    fetchSuggestions();
  }, [fileId]);

  const appendAssistant = (content: string, canContactSupport = false) => {
    setMessages((prev) => [...prev, { role: "assistant", content, canContactSupport }]);
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const localAnswer = answerFromLocalKnowledge(msg);
    if (localAnswer) {
      window.setTimeout(() => {
        appendAssistant(localAnswer, msg.toLowerCase().includes("support"));
        setLoading(false);
      }, 350);
      return;
    }

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
      const data = await res.json().catch(() => ({}));
      appendAssistant(
        data.response || "I could not find a clear answer. You can send this to support and the team will follow up.",
        !data.response
      );
    } catch {
      appendAssistant("I could not reach the AI service. You can send your question to support and the team will follow up.", true);
    } finally {
      setLoading(false);
    }
  };

  const submitSupport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = (supportEmail || user?.email || "").trim();
    if (!email || !supportMessage.trim() || supportSending) return;

    setSupportSending(true);
    setSupportStatus(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("application", supportApplication);
    formData.set("message", supportMessage.trim());
    supportFiles.forEach((file) => formData.append("attachments", file));

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to send support message.");
      }
      setSupportStatus(data.message || "Thanks, your message has been sent to support.");
      setSupportMessage("");
      setSupportFiles([]);
    } catch (error) {
      setSupportStatus(error instanceof Error ? error.message : "Unable to send support message.");
    } finally {
      setSupportSending(false);
    }
  };

  const renderContent = (content: string) =>
    content.split("\n").map((line, index) => (
      <p key={`${line}-${index}`} className="help-message-line">
        {line}
      </p>
    ));

  return (
    <div className="global-help">
      {open && (
        <section className="global-help-panel" aria-label="MateAI Assistant">
          <header className="global-help-header">
            <button
              type="button"
              className={view === "chat" ? "global-help-tab active" : "global-help-tab"}
              onClick={() => setView("chat")}
            >
              <Bot aria-hidden="true" />
              Ask
            </button>
            <button
              type="button"
              className={view === "support" ? "global-help-tab active" : "global-help-tab"}
              onClick={() => setView("support")}
            >
              <MessageSquare aria-hidden="true" />
              Leave a message
            </button>
            <button type="button" className="global-help-minimize" onClick={() => setOpen(false)} aria-label="Close help">
              <ChevronDown aria-hidden="true" />
            </button>
          </header>

          {view === "chat" ? (
            <>
              <div className="global-help-messages">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`global-help-row ${message.role}`}>
                    {message.role === "assistant" && (
                      <span className="global-help-avatar">
                        <Bot aria-hidden="true" />
                      </span>
                    )}
                    <div className="global-help-bubble">
                      {renderContent(message.content)}
                      {message.canContactSupport && (
                        <button type="button" className="global-help-link" onClick={() => setView("support")}>
                          Send to support
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="global-help-row assistant">
                    <span className="global-help-avatar">
                      <Bot aria-hidden="true" />
                    </span>
                    <div className="global-help-bubble muted">Thinking...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 1 && (
                <div className="global-help-suggestions">
                  {suggestions.slice(0, 4).map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div className="global-help-compose">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                  placeholder="Ask MateAI anything..."
                  disabled={loading}
                />
                <button type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()} aria-label="Send">
                  <Send aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <form className="global-help-support" onSubmit={submitSupport}>
              <label>
                Email address
                <input
                  type="email"
                  value={supportEmail || user?.email || ""}
                  onChange={(event) => setSupportEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                Select Application
                <select value={supportApplication} onChange={(event) => setSupportApplication(event.target.value)}>
                  {APPLICATIONS.map((application) => (
                    <option key={application} value={application}>
                      {application}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                How can we help you?
                <textarea
                  value={supportMessage}
                  onChange={(event) => setSupportMessage(event.target.value)}
                  rows={5}
                  required
                />
              </label>

              <label className="global-help-upload">
                <Paperclip aria-hidden="true" />
                <span>{supportFiles.length ? `${supportFiles.length} file(s) selected` : "Add up to 5 files"}</span>
                <input
                  type="file"
                  multiple
                  onChange={(event) => setSupportFiles(Array.from(event.target.files || []).slice(0, 5))}
                />
              </label>

              {supportStatus && <p className="global-help-status">{supportStatus}</p>}

              <div className="global-help-footer">
                <span>MonetizeMate support</span>
                <button type="submit" disabled={supportSending || !(supportEmail || user?.email || "").trim() || !supportMessage.trim()}>
                  {supportSending ? "Sending" : "Send"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <button type="button" className="global-help-button" onClick={() => setOpen((current) => !current)}>
        {open ? <X aria-hidden="true" /> : <HelpCircle aria-hidden="true" />}
        <span>MateAI</span>
      </button>
    </div>
  );
}


