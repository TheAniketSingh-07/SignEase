'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic,
  MicOff,
  AlertCircle,
  Sparkles,
  Volume2,
  Send,
  Radio,
  CheckCircle2,
} from 'lucide-react'
import { useAccessibility } from './AccessibilityProvider'

export function useSpeechRecognition({ onTranscript, onError }) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [permissionState, setPermissionState] = useState('prompt') // 'prompt', 'granted', 'denied'
  const [audioLevel, setAudioLevel] = useState(0) // 0 to 100 for live visualizer
  const [errorMessage, setErrorMessage] = useState('')

  const recognitionRef = useRef(null)
  const shouldListenRef = useRef(false)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const micStreamRef = useRef(null)
  const animFrameRef = useRef(null)

  // Use refs for callbacks to avoid re-triggering useEffect
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const { speechLanguage } = useAccessibility()

  // Initialize SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)

    if (!SpeechRecognition) {
      setIsSupported(false)
      setErrorMessage('Browser Speech Recognition not supported. Use Chrome or Edge, or the quick caption bar below.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognition.lang = speechLanguage || 'en-US'
      recognitionRef.current = recognition

      recognition.onstart = () => {
        setIsListening(true)
        setPermissionState('granted')
        setErrorMessage('')
      }

      recognition.onresult = (event) => {
        let currentInterim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            if (transcript.trim().length > 0) {
              if (onTranscriptRef.current) {
                onTranscriptRef.current(transcript.trim())
              }
            }
            setInterimText('')
          } else {
            currentInterim += transcript
          }
        }
        setInterimText(currentInterim)
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error event:', event.error)
        if (event.error === 'not-allowed') {
          setPermissionState('denied')
          setErrorMessage('Microphone access blocked. Please allow microphone in browser settings.')
          setIsListening(false)
          shouldListenRef.current = false
        } else if (event.error === 'no-speech') {
          // normal timeout on silence; will auto-restart in onend
        } else {
          setErrorMessage(`Speech status: ${event.error}`)
        }
        if (onErrorRef.current) onErrorRef.current(event.error)
      }

      recognition.onend = () => {
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (e) {}
            }
          }, 150)
        } else {
          setIsListening(false)
        }
      }
    } catch (err) {
      console.error('Speech recognition init error:', err)
      setIsSupported(false)
    }

    return () => {
      shouldListenRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
      stopAudioVisualizer()
    }
  }, [speechLanguage])

  // Setup Web Audio API volume visualizer
  const startAudioVisualizer = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream

        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioCtx()
        audioContextRef.current = ctx
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        analyserRef.current = analyser

        const source = ctx.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateMeter = () => {
          if (!analyserRef.current || !shouldListenRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          const level = Math.min(100, Math.round((avg / 128) * 100))
          setAudioLevel(level)
          animFrameRef.current = requestAnimationFrame(updateMeter)
        }
        updateMeter()
      }
    } catch (err) {
      console.warn('Audio meter init note:', err)
    }
  }

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }

  const startListening = useCallback(async () => {
    shouldListenRef.current = true
    setErrorMessage('')

    // 1. Explicitly request microphone stream
    let micStream = null
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setPermissionState('granted')
        micStreamRef.current = micStream
      } catch (err) {
        console.warn('Microphone permission error:', err)
        setPermissionState('denied')
        setErrorMessage('Microphone access blocked. Please allow microphone permissions in your browser address bar.')
      }
    }

    // 2. Start Web Speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        try {
          recognitionRef.current.abort()
          setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
                setIsListening(true)
              } catch (err2) {}
            }
          }, 100)
        } catch (e2) {}
      }
    }

    // 3. Start audio volume visualizer with existing stream
    if (micStream) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioCtx()
        audioContextRef.current = ctx
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        analyserRef.current = analyser

        const source = ctx.createMediaStreamSource(micStream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateMeter = () => {
          if (!analyserRef.current || !shouldListenRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          const level = Math.min(100, Math.round((avg / 128) * 100))
          setAudioLevel(level)
          animFrameRef.current = requestAnimationFrame(updateMeter)
        }
        updateMeter()
      } catch (e) {}
    }
  }, [])

  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    setIsListening(false)
    setInterimText('')
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }
    stopAudioVisualizer()
  }, [])

  return {
    isListening,
    interimText,
    isSupported,
    permissionState,
    audioLevel,
    errorMessage,
    startListening,
    stopListening,
  }
}

export function SpeechControlToolbar({
  isListening,
  onToggle,
  onClear,
  onSimulateSpeech,
  interimText,
  audioLevel = 0,
  errorMessage = '',
  onDirectCaptionSend,
}) {
  const [typedCaption, setTypedCaption] = useState('')

  const handleSendTyped = (e) => {
    e.preventDefault()
    if (!typedCaption.trim()) return
    if (onDirectCaptionSend) {
      onDirectCaptionSend(typedCaption.trim())
    }
    setTypedCaption('')
  }

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Mic Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={onToggle}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse-subtle'
              : 'bg-brand-500 hover:bg-brand-600 text-white'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop Captions
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Captions (Mic)
            </>
          )}
        </button>

        {/* Live Audio Activity Meter */}
        {isListening && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Mic Level:</span>
            <div className="flex items-end gap-0.5 h-4 w-16">
              {[15, 35, 55, 75, 95].map((threshold, i) => (
                <div
                  key={i}
                  className={`w-2.5 rounded-xs transition-all duration-75 ${
                    audioLevel >= threshold ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  style={{ height: `${(i + 1) * 20}%` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">
              {audioLevel > 5 ? 'Active' : 'Listening...'}
            </span>
          </div>
        )}

        {onClear && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Clear Transcript
          </button>
        )}

        {onSimulateSpeech && (
          <button
            onClick={onSimulateSpeech}
            title="Stream sample speech sentence word-by-word"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition ml-auto border border-brand-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulate Speech
          </button>
        )}
      </div>

      {/* Direct Quick-Type Caption Input Bar */}
      <form onSubmit={handleSendTyped} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Or type speech caption here and press Enter..."
          value={typedCaption}
          onChange={(e) => setTypedCaption(e.target.value)}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!typedCaption.trim()}
          className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition disabled:opacity-40 flex items-center gap-1 shrink-0"
        >
          <Send className="w-3 h-3" />
          <span>Send</span>
        </button>
      </form>
    </div>
  )
}
