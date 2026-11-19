'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  BookOpen,
  Hand,
  Volume2,
  Share2,
  Trash2,
  ChevronDown,
} from 'lucide-react'

const SUGGESTIONS = [
  'How to start a classroom?',
  'How do students join with code?',
  'What sign gestures are supported?',
  'How does screen sharing work?',
  'How to create custom quizzes?',
  'How do I delete old classrooms?',
]

export default function SevaChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'seva',
      text: "👋 Hi! I'm **SEVA** (SignEase Virtual Agent), your personal AI assistant. Whether you're an educator setting up real-time captions or a student using sign language gestures, I'm here to help! What would you like to know?",
      time: 'Just now',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (queryText) => {
    const textToSend = queryText || input
    if (!textToSend || !textToSend.trim()) return

    const userMsg = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/seva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      })
      const data = await res.json()
      const botMsg = {
        id: 's_' + Date.now(),
        sender: 'seva',
        text: data.reply || "I'm here to assist you with classrooms, captions, and accessibility features.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 's_' + Date.now(),
          sender: 'seva',
          text: "I'm ready to help you with classroom codes, speech-to-text captions, and sign gestures!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-white/20"
        >
          {/* Animated Glow */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>

          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
            🤖
          </div>

          <div className="text-left">
            <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>Ask SEVA</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </p>
            <p className="text-[10px] text-white/80 leading-tight">Virtual Agent</p>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm tracking-tight">SEVA</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/80 font-bold uppercase tracking-wider">
                    Virtual Agent
                  </span>
                </div>
                <p className="text-[11px] text-white/80">SignEase 24/7 Classroom AI Assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'seva' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-2xs">
                    🤖
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs py-1">
                <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-xs">
                  🤖
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                  <span>SEVA is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="px-3 py-1 text-[11px] font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-full border border-brand-200 whitespace-nowrap transition shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask SEVA anything about SignEase..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition shadow-xs disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
