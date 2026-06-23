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
  "What is MonetizeMate?",
  "How do I get monetization recommendations?",
  "How can I analyze API performance?",
  "I need support",
];

const APPLICATIONS = [
  "MonetizeMate",
  "Strategy Advisor",
  "Analytics Workbench",
  "Prediction Model",
  "API Statistics",
  "Account and Login",
];

function answerFromLocalKnowledge(question: string): string | null {
  const text = question.toLowerCase();

  if (text.includes("support") || text.includes("human") || text.includes("contact")) {
    return "I can help connect you with the support team. Open the support form, add your email and details, and the team can follow up.";
  }

  if (text.includes("what is") || text.includes("monetizemate") || text.includes("monetize mate")) {
    return "MonetizeMate is an AI-powered API monetization workspace. It helps teams choose pricing models, create monetization recommendations, analyze API usage, review client and error trends, and forecast growth from uploaded API data.";
  }

  if (text.includes("strategy") || text.includes("recommendation") || text.includes("pricing")) {
    return "Use the Monetization Strategy Advisor to enter business data or answer the questionnaire. MonetizeMate then recommends pricing models such as tiered, pay-per-use, freemium, subscription, or hybrid approaches with implementation guidance.";
  }

  if (text.includes("analytics") || text.includes("performance") || text.includes("api stats")) {
    return "The Analytics Workbench helps you inspect uploaded API data, including usage trends, client behavior, distribution, rankings, response patterns, and operational signals that can inform monetization.";
  }

  if (text.includes("prediction") || text.includes("forecast") || text.includes("growth")) {
    return "The Prediction Model area uses historical API data to forecast growth and highlight patterns that can guide pricing, capacity, and revenue planning.";
  }

  if (text.includes("upload") || text.includes("file") || text.includes("data")) {
    return "You can upload API logs or monitoring data from the Analytics Workbench. MonetizeMate uses that data for statistics, analysis, forecasting, and recommendation workflows.";
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
      content: "Hi, I can help with MonetizeMate, strategy recommendations, analytics, predictions, uploads, and account questions.",
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
        <section className="global-help-panel" aria-label="MonetizeMate help">
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
                  placeholder="Ask anything about MonetizeMate..."
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
        <span>Help</span>
      </button>
    </div>
  );
}
