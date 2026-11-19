'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import TranscriptViewer from '@/components/TranscriptViewer'
import ClassroomPollModal from '@/components/ClassroomPollModal'
import ClassroomQuizModal from '@/components/ClassroomQuizModal'
import ClassroomResourcesModal from '@/components/ClassroomResourcesModal'
import ClassroomParticipantsModal from '@/components/ClassroomParticipantsModal'
import ClassroomNotFound from '@/components/ClassroomNotFound'
import {
  useSpeechRecognition,
  SpeechControlToolbar,
} from '@/components/SpeechRecognition'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { formatTime, getTimestampString } from '@/lib/utils'
import {
  Users,
  Clock,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Settings,
  Download,
  Save,
  CheckCircle2,
  BarChart2,
  Award,
  FileText,
  Edit,
  Hand,
  Volume2,
  Bell,
  Sparkles,
  HelpCircle,
  MessageSquare,
} from 'lucide-react'
import { useAccessibility } from '@/components/AccessibilityProvider'

export default function TeacherLiveClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code || 'NXJS428').toUpperCase()

  const [classroom, setClassroom] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [transcripts, setTranscripts] = useState([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [studentCount, setStudentCount] = useState(0)
  const [recentGestureAlert, setRecentGestureAlert] = useState(null)
  const [recentQuestionAlert, setRecentQuestionAlert] = useState(null)
  const [cameraActive, setCameraActive] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [classroomNotFound, setClassroomNotFound] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

  // Modals state
  const [showPollModal, setShowPollModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)

  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const { playNotificationSound, triggerVisualAlert } = useAccessibility()

  // 1. Role Enforcement
  useEffect(() => {
    const user = hybridStore.getCurrentUser()
    if (!user || user.role !== 'teacher') {
      router.replace(`/login?role=teacher&redirect=${encodeURIComponent(`/classroom/${code}/teacher`)}`)
      return
    }
    setCurrentUser(user)
  }, [code, router])

  // 2. Speech-to-Text with Real-Time Interim Streaming
  const handleNewTranscript = async (finalText) => {
    if (!finalText || !finalText.trim()) return
    const teacherName = classroom?.teacher_name || currentUser?.name || 'Teacher'
    const item = await hybridStore.addTranscriptItem(code, {
      speaker: teacherName,
      text: finalText,
      timestamp: getTimestampString(),
    })
    if (item) {
      setTranscripts((prev) => {
        if (prev.some((t) => t.id === item.id)) return prev
        return [...prev, item]
      })
    }
    // Clear interim on final
    hybridStore.broadcastInterimTranscript(code, '')
  }

  const {
    isListening,
    interimText,
    audioLevel,
    errorMessage: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: handleNewTranscript,
    onError: (err) => console.warn('Speech error:', err),
  })

  // Broadcast interim words as teacher speaks so students see words in real time
  useEffect(() => {
    if (isListening && interimText) {
      hybridStore.broadcastInterimTranscript(code, interimText)
    }
  }, [code, isListening, interimText])

  // 3. Load initial classroom data, students and transcripts from backend
  useEffect(() => {
    let isCancelled = false

    const loadData = async () => {
      // Confirm with the server that this browser is really signed in as a teacher
      const verified = await hybridStore.syncSession()
      if (isCancelled) return
      if (!verified || verified.role !== 'teacher') {
        router.replace(`/login?role=teacher&redirect=${encodeURIComponent(`/classroom/${code}/teacher`)}`)
        return
      }

      const c = await hybridStore.getClassroomByCode(code)
      if (isCancelled) return
      if (!c) {
        setClassroomNotFound(true)
        return
      }

      // The server only returns full data to the teacher who owns the classroom
      if (c.public_view) {
        setAccessMessage('This classroom was created by a different teacher, so you cannot run it.')
        setClassroomNotFound(true)
        return
      }

      setClassroom(c)
      setStudentCount((c.students || []).length)

      const transList = await hybridStore.getTranscripts(code)
      if (isCancelled) return
      setTranscripts(Array.isArray(transList) ? transList : [])
    }

    loadData()

    // Real-time synchronization
    const unsubscribe = hybridStore.subscribe(code, (msg) => {
      // New final transcript from server
      if (msg.type === 'NEW_TRANSCRIPT') {
        if (msg.item) {
          setTranscripts((prev) => {
            if (prev.some((t) => t.id === msg.item.id)) return prev
            return [...prev, msg.item]
          })
        } else {
          hybridStore.getTranscripts(code).then((list) => {
            if (!isCancelled) setTranscripts(list || [])
          })
        }
      }

      if (msg.type === 'TRANSCRIPTS_CLEARED') {
        setTranscripts([])
      }

      // Real student joined or left
      if (msg.type === 'STUDENT_JOINED' || msg.type === 'STUDENT_REMOVED' || msg.type === 'STUDENTS_UPDATED') {
        if (msg.student_count !== undefined) {
          setStudentCount(msg.student_count)
        } else if (msg.students) {
          setStudentCount(msg.students.length)
        } else {
          hybridStore.getClassroomStudents(code).then((st) => {
            if (!isCancelled) setStudentCount(st.length)
          })
        }
      }

      if (msg.type === 'CLASSROOM_UPDATED' || msg.type === 'CLASSROOM_EDITED') {
        if (msg.classroom) setClassroom(msg.classroom)
      }

      // Real-time gesture from student
      if (msg.type === 'NEW_GESTURE_EVENT') {
        const ev = msg.event || msg.payload?.event
        if (ev) {
          setRecentGestureAlert(ev)
          playNotificationSound()
          triggerVisualAlert()
        }
      }

      // Real-time typed question from student
      if (msg.type === 'STUDENT_QUESTION') {
        const q = msg.question || msg.payload?.question
        if (q) {
          setRecentQuestionAlert(q)
          playNotificationSound()
          triggerVisualAlert()
        }
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [code, playNotificationSound, triggerVisualAlert])

  // Timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 4. Webcam Initialization & Cleanup
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        })
        cameraStreamRef.current = stream
        if (videoRef.current && !isScreenSharing) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setCameraActive(true)
        if (currentUser) {
          hybridStore.updateMediaState(code, {
            userId: currentUser.id,
            role: 'teacher',
            is_camera_on: true,
            is_mic_on: isListening,
            is_screen_sharing: isScreenSharing,
          })
        }
      }
    } catch (e) {
      console.warn('Camera start note:', e)
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop())
      cameraStreamRef.current = null
    }
    if (videoRef.current && !isScreenSharing) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    if (currentUser) {
      hybridStore.updateMediaState(code, {
        userId: currentUser.id,
        role: 'teacher',
        is_camera_on: false,
        is_mic_on: isListening,
        is_screen_sharing: isScreenSharing,
      })
    }
  }

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  // 5. Screen Sharing Handler
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }
      setIsScreenSharing(false)
      await hybridStore.toggleScreenShare(code, {
        is_screen_sharing: false,
        shared_by: currentUser?.name || 'Teacher',
        role: 'teacher',
      })
      // Restore camera
      if (cameraActive && cameraStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current
        videoRef.current.play().catch(() => {})
      }
    } else {
      // Start sharing
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert('Screen sharing is not supported on this browser.')
          return
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })
        screenStreamRef.current = screenStream

        if (videoRef.current) {
          videoRef.current.srcObject = screenStream
          videoRef.current.play().catch(() => {})
        }
        setIsScreenSharing(true)

        await hybridStore.toggleScreenShare(code, {
          is_screen_sharing: true,
          shared_by: currentUser?.name || 'Teacher',
          role: 'teacher',
        })

        // Listen for user stopping share via browser native banner
        screenStream.getVideoTracks()[0].onended = async () => {
          setIsScreenSharing(false)
          screenStreamRef.current = null
          await hybridStore.toggleScreenShare(code, {
            is_screen_sharing: false,
            shared_by: currentUser?.name || 'Teacher',
            role: 'teacher',
          })
          if (cameraActive && cameraStreamRef.current && videoRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current
            videoRef.current.play().catch(() => {})
          }
        }
      } catch (err) {
        console.warn('Screen share cancelled/denied:', err)
      }
    }
  }

  const handleEndClass = async () => {
    if (confirm('Are you sure you want to end this lecture session?')) {
      await hybridStore.updateClassroomStatus(code, false)
      stopListening()
      stopCamera()
      router.push(`/classroom/${code}/summary`)
    }
  }

  // Realistic sequential simulated speech for testing without microphone
  const simulationStep = useRef(0)
  const handleSimulateSpeech = () => {
    const phrases = [
      'Welcome everyone to today’s lecture on Next.js App Router and accessibility architecture.',
      'Server Components run strictly on the server and stream lightweight HTML directly to clients.',
      'API Routes in Next.js provide built-in endpoints using GET and POST methods.',
      'For deaf and hard-of-hearing students, real-time speech captions ensure complete educational equity.',
      'MediaPipe tracks 21 hand landmarks in real time to recognize questions and feedback from students.',
      'Notice how the live captions synchronize with sub-second latency across all devices.',
    ]
    const phrase = phrases[simulationStep.current % phrases.length]
    simulationStep.current += 1

    const words = phrase.split(' ')
    let current = ''
    words.forEach((w, idx) => {
      setTimeout(() => {
        current += (idx > 0 ? ' ' : '') + w
        hybridStore.broadcastInterimTranscript(code, current)
        if (idx === words.length - 1) {
          handleNewTranscript(phrase)
        }
      }, idx * 110)
    })
  }

  const handleSave = () => {
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
  }

  if (classroomNotFound) {
    return (
      <ClassroomNotFound
        code={code}
        message={accessMessage || undefined}
        title={accessMessage ? 'Not Your Classroom' : undefined}
        backHref="/teacher/dashboard"
        backLabel="Back to Dashboard"
      />
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role="teacher" />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {classroom?.name || 'Classroom Session'}
                </h1>
                <button
                  onClick={() => setShowParticipantsModal(true)}
                  className="p-1 text-slate-400 hover:text-brand-600 transition"
                  title="Edit classroom info or manage participants"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Code: <span className="font-mono font-bold text-brand-600">{code}</span> • {classroom?.subject || 'Lecture'}
              </p>
            </div>

            {/* Live Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-live-ping" />
              Live
            </div>

            {/* Real Student Count / Participants trigger */}
            <button
              onClick={() => setShowParticipantsModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>{studentCount} student{studentCount === 1 ? '' : 's'} connected</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Feature Buttons: Polls, Quiz, Resources */}
            <button
              onClick={() => setShowPollModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition shadow-2xs"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Polls</span>
            </button>

            <button
              onClick={() => setShowQuizModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition shadow-2xs"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Quiz</span>
            </button>

            <button
              onClick={() => setShowResourcesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Share PDF</span>
            </button>

            {/* Stopwatch Timer */}
            <div className="hidden md:flex items-center gap-2 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            {/* End Class Button */}
            <button
              onClick={handleEndClass}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition"
            >
              End Class
            </button>
          </div>
        </header>

        {/* Real-Time Student Sign Gesture Notification Alert Banner */}
        {recentGestureAlert && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 flex items-center justify-between shadow-lg transition-all animate-bounce shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-1 bg-white/20 rounded-xl shadow-xs">
                {recentGestureAlert.emoji || '✋'}
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-100">
                  Student Sign Gesture Detected!
                </p>
                <p className="text-sm font-bold">
                  <span className="underline decoration-white/60">{recentGestureAlert.student_name}</span> signed:{' '}
                  <span className="bg-white/25 px-2 py-0.5 rounded-md font-mono text-white">
                    {recentGestureAlert.gesture_label}
                  </span>{' '}
                  — {recentGestureAlert.meaning}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecentGestureAlert(null)}
                className="text-xs font-bold bg-white text-slate-900 hover:bg-amber-50 px-4 py-1.5 rounded-xl shadow-xs transition"
              >
                Acknowledge
              </button>
              <button
                onClick={() => setRecentGestureAlert(null)}
                className="text-white hover:text-amber-100 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Real-Time Student Typed Question Alert Banner */}
        {recentQuestionAlert && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 flex items-center justify-between shadow-lg transition-all animate-pulse-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
                  Student Question Asked!
                </p>
                <p className="text-sm font-medium">
                  <strong className="underline decoration-white/50">{recentQuestionAlert.student_name}</strong> asks:{' '}
                  <span className="bg-white/20 px-2.5 py-0.5 rounded-md font-medium text-white italic">
                    "{recentQuestionAlert.text}"
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecentQuestionAlert(null)}
                className="text-xs font-bold bg-white text-slate-900 hover:bg-blue-50 px-4 py-1.5 rounded-xl shadow-xs transition"
              >
                Got It
              </button>
              <button
                onClick={() => setRecentQuestionAlert(null)}
                className="text-white hover:text-blue-200 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main 2-Column Classroom Workspace */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
          {/* Left Column: Teacher Camera, Screen Share & Speech Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col flex-1">
              {/* Video container */}
              <div className="relative flex-1 bg-slate-900 min-h-[300px] flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    !isScreenSharing ? 'transform scale-x-[-1]' : ''
                  } ${cameraActive || isScreenSharing ? 'block' : 'hidden'}`}
                />

                {/* Camera Off Placeholder */}
                {!cameraActive && !isScreenSharing && (
                  <div className="text-center p-6 text-slate-400">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-300 font-bold text-2xl">
                      {(currentUser?.name || 'T')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <p className="text-sm font-bold text-white">Camera is Off</p>
                    <p className="text-xs text-slate-400 mt-1">Audio & Speech-to-Text active</p>
                  </div>
                )}

                {/* Floating Teacher (You) Badge */}
                <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 border border-slate-700 shadow-md">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Teacher ({currentUser?.name || 'You'})</span>
                </div>

                {/* Screen Share Active Banner */}
                {isScreenSharing && (
                  <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Sharing Screen</span>
                  </div>
                )}

                {/* Media Control Quick Buttons Floating Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {/* Camera toggle */}
                  <button
                    onClick={toggleCamera}
                    title={cameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
                    className={`p-2 rounded-xl backdrop-blur-md border transition ${
                      cameraActive
                        ? 'bg-slate-900/85 text-white border-slate-700 hover:bg-slate-800'
                        : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
                    }`}
                  >
                    {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>

                  {/* Screen Share toggle */}
                  <button
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                    className={`p-2 rounded-xl backdrop-blur-md border transition ${
                      isScreenSharing
                        ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 animate-pulse'
                        : 'bg-slate-900/85 text-white border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </button>

                  {/* Mic status indicator */}
                  <div className="bg-slate-900/85 backdrop-blur-md p-2 rounded-xl text-white border border-slate-700">
                    {isListening ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold px-1">
                        <Mic className="w-4 h-4 animate-pulse" />
                        <span>Live</span>
                      </div>
                    ) : (
                      <MicOff className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Speech Controls */}
              <div className="p-4 bg-white border-t border-slate-100">
                <SpeechControlToolbar
                  isListening={isListening}
                  onToggle={isListening ? stopListening : startListening}
                  onClear={() => {
                    if (confirm('Clear transcript for this session?')) {
                      hybridStore.clearTranscripts(code)
                      setTranscripts([])
                    }
                  }}
                  onSimulateSpeech={handleSimulateSpeech}
                  onDirectCaptionSend={handleNewTranscript}
                  interimText={interimText}
                  audioLevel={audioLevel}
                  errorMessage={speechError}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Transcript Stream */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
            <TranscriptViewer
              transcripts={transcripts}
              interimText={interimText}
              isLive={true}
              title="Live Lecture Transcript"
              onDownload={() => {
                const text = transcripts
                  .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
                  .join('\n')
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${classroom?.name || 'Class'}-Transcript.txt`
                a.click()
              }}
              onSave={handleSave}
              onOpenSettings={() => router.push('/settings')}
            />
          </div>
        </div>

        {/* Bottom Persistent Action Bar */}
        <footer className="bg-white border-t border-slate-200/80 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const text = transcripts
                  .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
                  .join('\n')
                const blob = new Blob([text], { type: 'text/plain' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `Transcript-${code}.txt`
                a.click()
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Transcript
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              {savedToast ? 'Saved!' : 'Save'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowParticipantsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              <Users className="w-3.5 h-3.5" />
              Connected Students ({studentCount})
            </button>

            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
          </div>
        </footer>
      </main>

      {/* Classroom Modals */}
      <ClassroomPollModal
        code={code}
        role="teacher"
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
      />

      <ClassroomQuizModal
        code={code}
        role="teacher"
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />

      <ClassroomResourcesModal
        code={code}
        role="teacher"
        isOpen={showResourcesModal}
        onClose={() => setShowResourcesModal(false)}
      />

      <ClassroomParticipantsModal
        code={code}
        classroom={classroom}
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        onClassroomUpdated={(updated) => setClassroom(updated)}
      />
    </div>
  )
}
