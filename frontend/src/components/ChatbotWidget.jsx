import { useState, useRef, useEffect, useContext } from 'react'
import { api } from '../lib/api.js'
import { AuthContext } from '../context/AuthContext.js'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  FlaskConical,
  Calendar,
  FileText,
  BadgeAlert,
} from 'lucide-react'

// Knowledge Base for LIS Assistant
const KNOWLEDGE_BASE = [
  {
    keywords: ['fast', 'fasting', 'eat', 'food', 'water', 'breakfast', 'empty stomach'],
    response: `🩸 **Fasting Guidelines for Lab Tests:**
- **Fasting Blood Sugar (FBS)**: Fasting for **8 - 10 hours** overnight is required. Only plain water is permitted.
- **Lipid Profile**: Requires **10 - 12 hours** of strict fasting.
- **Full Blood Count (FBC / CBC)**: No fasting required.
- **HbA1c (Diabetes Index)**: No fasting required. You can eat normally.`,
  },
  {
    keywords: ['price', 'cost', 'fee', 'charge', 'rate', 'how much', 'lkr'],
    response: `💰 **Laboratory Diagnostic Test Directory & Rates:**
- **Complete Blood Count (CBC / FBC)**: LKR 1,200.00
- **Fasting Blood Sugar (FBS)**: LKR 650.00
- **HbA1c Profile**: LKR 2,100.00
- **Lipid Profile (Cholesterol Panel)**: LKR 2,400.00
- **Thyroid Function Test (TSH / T3 / T4)**: LKR 3,500.00
- **Kidney Function Test (Serum Creatinine / Urea)**: LKR 1,800.00
*Digital QR receipts with exact itemized prices are provided for every booking!*`,
  },
  {
    keywords: ['hour', 'time', 'open', 'timing', 'working', 'schedule', 'sunday', 'weekend'],
    response: `🕒 **Clinical Laboratory Hours & Sample Collection:**
- **Monday – Saturday**: 6:30 AM – 7:00 PM
- **Sunday & Public Holidays**: 7:00 AM – 2:00 PM
- **Emergency Specimen Intake**: Open 24/7 for urgent clinical orders.`,
  },
  {
    keywords: ['book', 'appointment', 'schedule', 'register', 'how to book'],
    response: `📅 **How to Book a Laboratory Appointment:**
1. Log into your **Patient Portal**.
2. Click the **"Book Appointment"** button on your dashboard.
3. Select your desired diagnostic test profiles and appointment date/time.
4. Confirm your booking! A unique **Token Number** and **Sample Barcode** will be generated immediately.`,
  },
  {
    keywords: ['qr', 'code', 'receipt', 'digital receipt', 'verify', 'verification', 'barcode'],
    response: `📜 **Digital QR Receipt & Verification:**
- Every appointment includes an official **Digital QR Receipt**.
- Click **"Digital QR Receipt"** on any appointment card on your Patient Dashboard.
- Scanning the QR code displays your **Token Number**, itemized test prices, payment status, and verification seal!`,
  },
  {
    keywords: ['result', 'report', 'download', 'pdf', 'view report'],
    response: `📄 **Accessing Your Test Results & Medical PDF:**
- Once our Lab Technicians complete and sign off on your specimens, your status will change to **COMPLETED**.
- Click **"View Lab Report"** on your dashboard to inspect your multi-parameter results or download a certified PDF copy.`,
  },
  {
    keywords: ['2fa', 'two factor', 'security', 'otp', 'password', 'forgot password'],
    response: `🔒 **Security & Account Support:**
- **Forgot Password**: Click "Forgot your password?" on the Login screen to receive a 30-minute secure reset link via email.
- **Two-Factor Authentication (2FA)**: You can enable Email OTP or Authenticator App (TOTP) under your **Profile Settings**.`,
  },
  {
    keywords: ['location', 'address', 'where', 'find us', 'contact', 'phone'],
    response: `📍 **Lab Location & Contact Details:**
- **Address**: 124 Clinical Health Avenue, Medical Zone, Sector 4
- **Phone**: +94 (0) 11 234 5678 / +94 (0) 77 123 4567
- **Support Email**: support@lis-laboratory.org`,
  },
]

const QUICK_ACTIONS = [
  { label: '🩸 Fasting Rules', query: 'What are the fasting rules for blood tests?' },
  { label: '💰 Test Prices', query: 'Show me test directory prices' },
  { label: '🕒 Lab Operating Hours', query: 'What are your working hours?' },
  { label: '📅 How to Book', query: 'How do I book an appointment?' },
  { label: '📜 QR Receipt Info', query: 'How does the Digital QR Receipt work?' },
]

function FormattedMessage({ text, isUser }) {
  if (!text) return null

  const lines = text.split('\n')

  return (
    <div className="space-y-1.5 leading-relaxed text-[13px] sm:text-[14px]">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        const isBullet = /^[*\-•]\s+/.test(trimmed)
        const isNumbered = /^\d+\.\s+/.test(trimmed)

        let content = trimmed
        let bulletPrefix = null

        if (isBullet) {
          content = trimmed.replace(/^[*\-•]\s+/, '')
          bulletPrefix = (
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full mt-2 mr-2 shrink-0 ${
                isUser ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'
              }`}
            />
          )
        } else if (isNumbered) {
          const match = trimmed.match(/^(\d+\.)\s+/)
          if (match) {
            bulletPrefix = (
              <span
                className={`font-bold mr-1.5 shrink-0 ${
                  isUser ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
                }`}
              >
                {match[1]}
              </span>
            )
            content = trimmed.replace(/^\d+\.\s+/, '')
          }
        }

        const parseInline = (str) => {
          const parts = str.split(/(\*\*.*?\*\*)/g)
          return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong
                  key={pIdx}
                  className={
                    isUser
                      ? 'font-bold text-white'
                      : 'font-bold text-slate-900 dark:text-white'
                  }
                >
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return part
          })
        }

        if (isBullet || isNumbered) {
          return (
            <div key={idx} className="flex items-start pl-0.5">
              {bulletPrefix}
              <div className="flex-1">{parseInline(content)}</div>
            </div>
          )
        }

        return (
          <div key={idx} className="leading-relaxed">
            {parseInline(content)}
          </div>
        )
      })}
    </div>
  )
}

export function ChatbotWidget() {
  const authContext = useContext(AuthContext)
  const currentUserId = authContext?.user?.id || authContext?.user?.email || 'guest'

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `👋 Hello! I am online and ready to assist you.

You can ask me about:
- 🧪 **Laboratory Tests & Fasting Preparation** (e.g., FBS, Lipid Profile)
- 💰 **Test Directory & Pricing** (in LKR)
- 📅 **Appointment Booking & Digital QR Receipts**
- 🕒 **Operating Hours & Lab Location**
- 📄 **Viewing / Downloading Lab Reports**

How can I help you with your laboratory queries today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  // Reset chat state when switching profiles or logging in/out
  useEffect(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: `👋 Hello! I am online and ready to assist you.

You can ask me about:
- 🧪 **Laboratory Tests & Fasting Preparation** (e.g., FBS, Lipid Profile)
- 💰 **Test Directory & Pricing** (in LKR)
- 📅 **Appointment Booking & Digital QR Receipts**
- 🕒 **Operating Hours & Lab Location**
- 📄 **Viewing / Downloading Lab Reports**

How can I help you with your laboratory queries today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setIsOpen(false)
  }, [currentUserId])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setHasUnread(false)
    }
  }, [messages, isOpen])

  const findMatchingResponse = (userText) => {
    const textLower = userText.toLowerCase()

    for (const kb of KNOWLEDGE_BASE) {
      if (kb.keywords.some((keyword) => textLower.includes(keyword))) {
        return kb.response
      }
    }

    return `⚠️ **Out of Scope Inquiry**
I am trained exclusively for this Laboratory Information System scope (lab test directory, fasting preparation, test pricing, appointment booking, digital QR receipts, and lab reports).

If you have questions regarding lab services or test preparation, please let me know! For emergencies, call **+94 11 234 5678**.`
  }

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInput('')
    setIsTyping(true)

    try {
      const response = await api.post(
        '/chat',
        {
          message: query,
          history: messages.slice(-6),
        },
        { timeout: 4000 }
      )

      let responseText
      let isAiGenerated = false

      if (response.data && !response.data.useFallback && response.data.reply) {
        responseText = response.data.reply
        isAiGenerated = true
      } else {
        responseText = findMatchingResponse(query)
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        isAi: isAiGenerated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch {
      const responseText = findMatchingResponse(query)
      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: `👋 Chat reset! I am ready for your next question. How can I assist you with laboratory services?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden font-sans">
      {/* Floating Chatbot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Open Medical Assistant Chatbot"
        >
          <Bot className="h-7 w-7 transition-transform group-hover:rotate-12" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white"></span>
            </span>
          )}
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="flex flex-col w-[370px] sm:w-[420px] h-[560px] max-h-[84vh] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-inner">
                <Bot className="h-6 w-6" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none flex items-center gap-1.5 text-white">
                  LIS HealthBot
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Virtual Medical Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Chat"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white mt-0.5 shadow-sm">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/90 rounded-bl-none'
                  }`}
                >
                  {msg.isAi && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 mb-1.5 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                      <Sparkles className="h-2.5 w-2.5" /> Gemini AI
                    </div>
                  )}

                  <FormattedMessage text={msg.text} isUser={msg.sender === 'user'} />

                  <div
                    className={`mt-2 text-[10px] font-bold ${
                      msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 mt-0.5">
                    <User className="h-4.5 w-4.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 italic text-[11px] pl-1">
                <Bot className="h-3.5 w-3.5 animate-bounce text-blue-600" />
                LIS HealthBot is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(action.query)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              placeholder="Ask about fasting, prices, booking..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  )
}
