'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Bot, Send, Sparkles, User } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { useAuth } from '@/app/hooks/useAuth'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type StrategyChatResponse = {
  message: string
  ready: boolean
  recommendations?: unknown
}

const GREETING =
  "Hi, I'm your AI Chat Advisor. Tell me what your API or digital product does, who uses it, and what you're trying to achieve with monetization. I'll ask a few focused questions, then turn the conversation into strategy recommendations."

const CHAT_STORAGE_KEY = 'monetizeMate.strategyAdvisor.aiChat.messages'
const MIN_THINKING_MS = 3500
const INITIAL_MESSAGES: ChatMessage[] = [{ role: 'assistant', content: GREETING }]

const getStoredMessages = () => {
  if (typeof window === 'undefined') {
    return INITIAL_MESSAGES
  }

  const shouldStartFresh = new URLSearchParams(window.location.search).get('fresh') === '1'
  if (shouldStartFresh) {
    window.localStorage.removeItem(CHAT_STORAGE_KEY)
    return INITIAL_MESSAGES
  }

  try {
    const storedMessages = window.localStorage.getItem(CHAT_STORAGE_KEY)
    if (!storedMessages) {
      return INITIAL_MESSAGES
    }

    const parsedMessages = JSON.parse(storedMessages) as ChatMessage[]
    const validMessages = parsedMessages.filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim()
    )

    return validMessages.length ? validMessages : INITIAL_MESSAGES
  } catch {
    window.localStorage.removeItem(CHAT_STORAGE_KEY)
    return INITIAL_MESSAGES
  }
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })

export default function StrategyAiChatPage() {
  const router = useRouter()
  const { authenticated, loading } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>(getStoredMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRecommendations, setPendingRecommendations] = useState<unknown>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const goBackToStrategyAdvisor = () => {
    window.localStorage.removeItem(CHAT_STORAGE_KEY)
    router.push('/dashboard/strategy-adviser')
  }

  const openRecommendations = () => {
    if (!pendingRecommendations) return

    const params = new URLSearchParams()
    params.set('analysisSource', 'ai-chat')
    params.set('recommendations', JSON.stringify(pendingRecommendations))
    router.push(`/dashboard/recommendation?${params.toString()}`)
  }

  const keepAddingInfo = () => {
    setPendingRecommendations(null)
    inputRef.current?.focus()
  }

  useEffect(() => {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (!loading && authenticated === false) {
      router.push('/login')
    }
  }, [authenticated, loading, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setError(null)
    setPendingRecommendations(null)
    setInput('')
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setSending(true)

    try {
      const [response] = await Promise.all([
        fetch('/api/strategy-advisor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: messages,
          }),
        }),
        wait(MIN_THINKING_MS),
      ])

      const data = (await response.json().catch(() => ({
        message: 'AI chat request failed',
      }))) as StrategyChatResponse & { detail?: string }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'AI chat request failed')
      }

      const assistantMessage = data.ready && data.recommendations
        ? `${data.message}\n\nYour strategy recommendations are ready. Would you like to view them now, or add more information first?`
        : data.message

      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        { role: 'assistant', content: assistantMessage },
      ]

      setMessages(finalMessages)
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(finalMessages))

      if (data.ready && data.recommendations) {
        setPendingRecommendations(data.recommendations)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to continue AI chat.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <Button
            variant="outline"
            className="chat-back"
            onClick={goBackToStrategyAdvisor}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Strategy Advisor
          </Button>
          <div className="chat-title">
            <span>
              <Bot className="w-7 h-7" />
            </span>
            <div>
              <h1>AI Chat Advisor</h1>
              <p>Conversational discovery for personalized monetization strategy</p>
            </div>
          </div>
        </header>

        <div className="chat-panel">
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-row ${message.role}`}>
                <div className="chat-avatar">
                  {message.role === 'assistant' ? <Bot aria-hidden="true" /> : <User aria-hidden="true" />}
                </div>
                <div className="chat-bubble">
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="chat-row assistant">
                <div className="chat-avatar">
                  <Sparkles aria-hidden="true" />
                </div>
                <div className="chat-bubble typing">Thinking...</div>
              </div>
            )}

            {pendingRecommendations && !sending && (
              <div className="chat-ready-actions">
                <Button type="button" onClick={openRecommendations} className="chat-ready-primary">
                  View Recommendations
                </Button>
                <Button type="button" variant="outline" onClick={keepAddingInfo} className="chat-ready-secondary">
                  Add More Info
                </Button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <Alert variant="destructive" className="chat-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form className="chat-compose" onSubmit={submitMessage}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe your API business, users, revenue goals, or pricing challenge..."
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Send message">
              <Send aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <style>{`
        .chat-page {
          min-height: 100vh;
          padding: 42px 24px 64px;
          background:
            radial-gradient(circle at 16% 0%, rgba(0, 229, 192, 0.14), transparent 32%),
            linear-gradient(135deg, #060e1e 0%, #0b1f36 52%, #071420 100%);
          color: #ffffff;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .chat-shell {
          width: min(980px, 100%);
          margin: 0 auto;
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 28px;
        }

        .chat-back {
          height: 44px;
          border: 1px solid rgba(0, 229, 192, 0.44);
          background: #11d3ba;
          color: #061421;
          font-weight: 800;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .chat-title span {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #00e5c0;
          border: 1px solid rgba(0, 229, 192, 0.28);
          background: rgba(0, 229, 192, 0.1);
        }

        .chat-title h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
          font-weight: 900;
        }

        .chat-title p {
          margin: 4px 0 0;
          color: rgba(255, 255, 255, 0.68);
          font-size: 15px;
        }

        .chat-panel {
          border-radius: 20px;
          border: 1px solid rgba(0, 229, 192, 0.2);
          background: rgba(17, 34, 54, 0.9);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .chat-messages {
          height: min(62vh, 620px);
          min-height: 430px;
          overflow-y: auto;
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .chat-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .chat-row.user {
          flex-direction: row-reverse;
        }

        .chat-avatar {
          width: 36px;
          height: 36px;
          flex: 0 0 auto;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 229, 192, 0.12);
          color: #00e5c0;
          border: 1px solid rgba(0, 229, 192, 0.2);
        }

        .chat-avatar svg {
          width: 18px;
          height: 18px;
        }

        .chat-bubble {
          max-width: min(680px, calc(100% - 58px));
          white-space: pre-wrap;
          border-radius: 16px;
          padding: 13px 15px;
          color: rgba(255, 255, 255, 0.86);
          background: rgba(31, 47, 68, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.07);
          font-size: 14px;
          line-height: 1.6;
          font-weight: 600;
        }

        .chat-row.user .chat-bubble {
          background: linear-gradient(135deg, #00e5c0, #1abfa3);
          color: #061421;
          border-color: rgba(255, 255, 255, 0.18);
        }

        .typing {
          color: rgba(255, 255, 255, 0.6);
        }

        .chat-ready-actions {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          margin-left: 48px;
          flex-wrap: wrap;
        }

        .chat-ready-primary,
        .chat-ready-secondary {
          height: 42px;
          border-radius: 10px;
          font-weight: 900;
        }

        .chat-ready-primary {
          background: linear-gradient(135deg, #00e5c0, #1abfa3);
          color: #061421;
        }

        .chat-ready-primary:hover {
          color: #061421;
        }

        .chat-ready-secondary {
          border-color: rgba(0, 229, 192, 0.34);
          background: rgba(0, 229, 192, 0.08);
          color: #ffffff;
        }

        .chat-ready-secondary:hover {
          background: rgba(0, 229, 192, 0.16);
          color: #ffffff;
        }

        .chat-error {
          margin: 0 26px 16px;
        }

        .chat-compose {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 48px;
          gap: 12px;
          padding: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(8, 20, 36, 0.58);
        }

        .chat-compose input {
          min-width: 0;
          height: 48px;
          border-radius: 12px;
          border: 1px solid rgba(0, 229, 192, 0.18);
          background: rgba(255, 255, 255, 0.055);
          color: #ffffff;
          padding: 0 15px;
          font-size: 14px;
          outline: none;
        }

        .chat-compose input:focus {
          border-color: rgba(0, 229, 192, 0.5);
        }

        .chat-compose button {
          width: 48px;
          height: 48px;
          border: 0;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #00e5c0, #1abfa3);
          color: #061421;
          cursor: pointer;
        }

        .chat-compose button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .chat-compose button svg {
          width: 19px;
          height: 19px;
        }

        @media (max-width: 720px) {
          .chat-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .chat-title h1 {
            font-size: 27px;
          }

          .chat-messages {
            min-height: 380px;
            padding: 18px;
          }

          .chat-ready-actions {
            margin-left: 0;
          }
        }
      `}</style>
    </main>
  )
}
