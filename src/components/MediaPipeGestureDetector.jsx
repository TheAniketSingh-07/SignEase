'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Hand } from 'lucide-react'
import { classifyHandGesture } from '../lib/gestures/classifier'
import { SUPPORTED_GESTURES } from '../lib/gestures/definitions'
import { useAccessibility } from './AccessibilityProvider'

// MediaPipe hand skeleton connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17], // Knuckles
]

export default function MediaPipeGestureDetector({
  onGestureDetected,
  activeClassroomCode,
  onOpenQuestionModal,
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [currentGesture, setCurrentGesture] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [confirmedGesture, setConfirmedGesture] = useState(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [holdProgress, setHoldProgress] = useState(0) // 0 to 100%

  // Hold gesture detection stabilization
  const gestureHoldCounter = useRef({ gestureId: null, count: 0 })
  const lastTriggerTime = useRef(0)
  const { gestureSensitivity, playNotificationSound, triggerVisualAlert } = useAccessibility()

  // Send confirmed gesture
  const triggerGestureAction = useCallback(
    (gesture, conf = 0.95) => {
      const now = Date.now()
      if (now - lastTriggerTime.current < 1800) return
      lastTriggerTime.current = now

      setConfirmedGesture(gesture)
      playNotificationSound()
      triggerVisualAlert()

      if (onGestureDetected) {
        onGestureDetected({
          gesture_name: gesture.name,
          gesture_label: gesture.label,
          meaning: gesture.meaning,
          emoji: gesture.emoji,
          confidence: conf,
        })
      }

      setHoldProgress(100)
      setTimeout(() => {
        setConfirmedGesture(null)
        setHoldProgress(0)
      }, 3000)
    },
    [onGestureDetected, playNotificationSound, triggerVisualAlert]
  )

  // Initialize MediaPipe Hands
  useEffect(() => {
    let handsInstance = null
    let animationFrameId = null
    let isCancelled = false

    const loadScriptsAndInit = async () => {
      try {
        if (!window.Hands) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
            script.crossOrigin = 'anonymous'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        if (isCancelled) return

        const Hands = window.Hands
        handsInstance = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        })

        handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: gestureSensitivity || 0.7,
          minTrackingConfidence: gestureSensitivity || 0.7,
        })

        handsInstance.onResults((results) => {
          if (isCancelled) return
          const canvas = canvasRef.current
          const video = videoRef.current
          if (!canvas || !video) return

          const ctx = canvas.getContext('2d')
          ctx.save()
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0]

            // 1. Draw Hand Skeleton Connectors
            ctx.strokeStyle = '#22c55e'
            ctx.lineWidth = 2.5
            HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
              const start = landmarks[startIdx]
              const end = landmarks[endIdx]
              ctx.beginPath()
              ctx.moveTo(start.x * canvas.width, start.y * canvas.height)
              ctx.lineTo(end.x * canvas.width, end.y * canvas.height)
              ctx.stroke()
            })

            // 2. Draw Landmark Joints
            ctx.fillStyle = '#10b981'
            landmarks.forEach((pt) => {
              ctx.beginPath()
              ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI)
              ctx.fill()
            })

            // 3. Draw Bounding Box
            let minX = 1,
              maxX = 0,
              minY = 1,
              maxY = 0
            landmarks.forEach((p) => {
              if (p.x < minX) minX = p.x
              if (p.x > maxX) maxX = p.x
              if (p.y < minY) minY = p.y
              if (p.y > maxY) maxY = p.y
            })

            const boxPadding = 0.04
            const x = Math.max(0, (minX - boxPadding) * canvas.width)
            const y = Math.max(0, (minY - boxPadding) * canvas.height)
            const w = Math.min(canvas.width - x, (maxX - minX + boxPadding * 2) * canvas.width)
            const h = Math.min(canvas.height - y, (maxY - minY + boxPadding * 2) * canvas.height)

            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 2
            ctx.strokeRect(x, y, w, h)

            // 4. Classify Gesture
            const { gesture, confidence: conf } = classifyHandGesture(landmarks)

            if (gesture) {
              setCurrentGesture(gesture)
              setConfidence(conf)

              if (gestureHoldCounter.current.gestureId === gesture.id) {
                gestureHoldCounter.current.count += 1
                const prog = Math.min(100, Math.round((gestureHoldCounter.current.count / 7) * 100))
                setHoldProgress(prog)

                // Confirmed after ~7 consecutive frames
                if (gestureHoldCounter.current.count >= 7) {
                  triggerGestureAction(gesture, conf)
                  gestureHoldCounter.current.count = 0
                }
              } else {
                gestureHoldCounter.current = { gestureId: gesture.id, count: 1 }
                setHoldProgress(15)
              }
            } else {
              setCurrentGesture(null)
              gestureHoldCounter.current = { gestureId: null, count: 0 }
              setHoldProgress(0)
            }
          } else {
            setCurrentGesture(null)
            gestureHoldCounter.current = { gestureId: null, count: 0 }
            setHoldProgress(0)
          }
          ctx.restore()
        })

        setIsModelLoading(false)

        // Start Webcam
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 480, facingMode: 'user' },
              audio: false,
            })
            if (videoRef.current && !isCancelled) {
              videoRef.current.srcObject = stream
              videoRef.current.onloadedmetadata = () => {
                videoRef.current.play()
                setCameraActive(true)

                const processVideo = async () => {
                  if (
                    !isCancelled &&
                    videoRef.current &&
                    videoRef.current.readyState >= 2 &&
                    handsInstance
                  ) {
                    await handsInstance.send({ image: videoRef.current })
                  }
                  if (!isCancelled) {
                    animationFrameId = requestAnimationFrame(processVideo)
                  }
                }
                processVideo()
              }
            }
          } catch (err) {
            console.warn('Webcam permission error:', err)
            setCameraError('Webcam unavailable or permission denied. You can use 1-click Quick Gestures below.')
            setIsModelLoading(false)
          }
        }
      } catch (err) {
        console.warn('MediaPipe error:', err)
        setIsModelLoading(false)
        setCameraError('Running in lightweight gesture mode.')
      }
    }

    loadScriptsAndInit()

    return () => {
      isCancelled = true
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
      if (handsInstance) {
        try {
          handsInstance.close()
        } catch (e) {}
      }
    }
  }, [gestureSensitivity, triggerGestureAction])

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-slate-800 text-sm">Sign Language Recognition</h3>
        </div>
        <div className="flex items-center gap-2">
          {onOpenQuestionModal && (
            <button
              onClick={onOpenQuestionModal}
              className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg border border-blue-200 transition"
            >
              Ask Question
            </button>
          )}
          <span className="text-xs px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold rounded-full border border-brand-200">
            MediaPipe AI 21-Point
          </span>
        </div>
      </div>

      {/* Video & Canvas View */}
      <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Real Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${
            cameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Landmarks overlay canvas */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1] ${
            cameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Fallback visual if camera not granted */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-300">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-400 border border-slate-700">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {isModelLoading ? 'Initializing Hand Tracker...' : 'Webcam Camera Mode'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mb-3">
              {cameraError || 'Allow camera to recognize hand gestures, or use the 1-click shortcuts below.'}
            </p>
          </div>
        )}

        {/* Floating detected gesture badge on top of video */}
        {currentGesture && (
          <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
            <span className="text-base">{currentGesture.emoji}</span>
            <span>{currentGesture.label}</span>
            <span className="text-[10px] opacity-80 font-normal">
              ({Math.round(confidence * 100)}%)
            </span>
          </div>
        )}

        {/* Hold progress bar at bottom of video */}
        {holdProgress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
            <div
              className="h-full bg-emerald-400 transition-all duration-100"
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Gesture Status Card (Matching Screen 8 in mockup) */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {confirmedGesture ? (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-start gap-3 transition-all animate-pulse-subtle">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-sm flex-shrink-0">
                {confirmedGesture.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                    {confirmedGesture.label}
                  </span>
                  <span className="text-[10px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full">
                    Sent to Teacher!
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5 font-medium">{confirmedGesture.meaning}</p>
              </div>
            </div>
          ) : currentGesture ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-sm flex-shrink-0">
                {currentGesture.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    {currentGesture.label}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">
                    Hold to send ({holdProgress}%)
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">{currentGesture.meaning}</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-500">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-xl flex-shrink-0">
                ✋
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800">Ready for gestures</p>
                <p className="text-slate-500 text-[11px]">
                  Raise index finger for <span className="font-semibold text-slate-700">Question</span>, open palm to <span className="font-semibold text-slate-700">Raise Hand</span>, or thumbs up for <span className="font-semibold text-slate-700">Understood</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* All 8 Supported Gestures 1-Click Fallback Shortcuts */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Instant Feedback Shortcuts</span>
            <span className="text-[10px] font-normal text-slate-400">8 Supported Signs</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SUPPORTED_GESTURES.map((g) => (
              <button
                key={g.id}
                onClick={() => triggerGestureAction(g, 1.0)}
                className="p-2 text-left bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-xl transition flex flex-col justify-between group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{g.emoji}</span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700 transition">
                    {g.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1 group-hover:text-brand-600">
                  {g.meaning}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
