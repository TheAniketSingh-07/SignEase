'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Download, Copy, Check, Search, Volume2, Sparkles } from 'lucide-react'
import { useAccessibility } from './AccessibilityProvider'

export default function TranscriptViewer({
  transcripts = [],
  interimText = '',
  isLive = false,
  title = 'Live Transcript',
  onDownload,
  onSave,
  onOpenSettings,
}) {
  const containerRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const { getCaptionFontSizeClass } = useAccessibility()

  // Auto scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [transcripts, interimText])

  const safeTranscripts = Array.isArray(transcripts) ? transcripts : []

  const filteredTranscripts = searchQuery
    ? safeTranscripts.filter((t) =>
        (t.text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.speaker || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : safeTranscripts

  const handleCopyAll = () => {
    const fullText = safeTranscripts
      .map((t) => `[${t.timestamp || ''}] ${t.speaker || 'Teacher'}: ${t.text}`)
      .join('\n')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
      return
    }
    const fullText = safeTranscripts
      .map((t) => `[${t.timestamp || ''}] ${t.speaker || 'Teacher'}: ${t.text}`)
      .join('\n')
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lecture-transcript-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 w-32 md:w-44"
          />
        </div>
      </div>

      {/* Transcript Items Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px] max-h-[520px]"
      >
        {filteredTranscripts.length === 0 && !interimText ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
            <Volume2 className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <p className="text-sm font-medium text-slate-600">No captions yet</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              {isLive
                ? 'Teacher speech will appear here in real-time.'
                : 'Start the microphone or simulate speech to generate captions.'}
            </p>
          </div>
        ) : (
          filteredTranscripts.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-3 group">
              <span className="text-xs font-semibold text-slate-400 pt-1 shrink-0 w-16">
                {item.timestamp || '10:00 AM'}
              </span>
              <div className="flex-1 bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3 border border-slate-100 transition">
                <p className={`text-slate-800 ${getCaptionFontSizeClass()}`}>
                  {item.text}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Interim / Draft caption live preview */}
        {interimText && (
          <div className="flex items-start gap-3 animate-pulse">
            <span className="text-xs font-semibold text-brand-500 pt-1 shrink-0 w-16">
              Now
            </span>
            <div className="flex-1 bg-brand-50/60 rounded-xl p-3 border border-brand-200/70">
              <p className={`text-brand-900 italic ${getCaptionFontSizeClass()}`}>
                {interimText}...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions (Matching Screen 7) */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download
          </button>
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                Copy
              </>
            )}
          </button>
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1"
          >
            Accessibility Options
          </button>
        )}
      </div>
    </div>
  )
}
