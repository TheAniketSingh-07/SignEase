'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import MediaPipeGestureDetector from '@/components/MediaPipeGestureDetector'
import TranscriptViewer from '@/components/TranscriptViewer'
import ClassroomPollModal from '@/components/ClassroomPollModal'
import ClassroomQuizModal from '@/components/ClassroomQuizModal'
import ClassroomResourcesModal from '@/components/ClassroomResourcesModal'
import ClassroomNotFound from '@/components/ClassroomNotFound'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  Users,
  LogOut,
  Sliders,
  Sparkles,
  HelpCircle,
  Eye,
  CheckCircle2,
  Volume2,
  FileText,
  Clock,
  BarChart2,
  Award,
  AlertTriangle,
  Send,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
} from 'lucide-react'
import { useAccessibility } from '@/components/AccessibilityProvider'

export default function StudentLiveClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code || 'NXJS428').toUpperCase()

  const [classroom, setClassroom] = useState(null)
  const [transcripts, setTranscripts] = useState([])
  const [interimText, setInterimText] = useState('')
  const [studentUser, setStudentUser] = useState(null)
  const [studentCount, setStudentCount] = useState(1)
  const [toastMessage, setToastMessage] = useState(null)
  const [wasKicked, setWasKicked] = useState(false)
  const [classroomNotFound, setClassroomNotFound] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

  // Media & Interaction States
  const [cameraActive, setCameraActive] = useState(true)
  const [micActive, setMicActive] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [activeScreenShare, setActiveScreenShare] = useState(null)

  // Question Feature State
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [typedQuestion, setTypedQuestion] = useState('')
  const [questionSending, setQuestionSending] = useState(false)

  // Interactive Modals
  const [showPollModal, setShowPollModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  const [pollHasActive, setPollHasActive] = useState(false)

  const screenStreamRef = useRef(null)
  const { playNotificationSound, triggerVisualAlert } = useAccessibility()

  // 1. ROLE ENFORCEMENT & REAL STUDENT REGISTRATION
  useEffect(() => {
    let u = hybridStore.getCurrentUser()
    if (!u || u.role !== 'student') {
      router.replace(
        `/login?role=student&code=${code}&redirect=${encodeURIComponent(`/classroom/${code}/student`)}`
      )
      return
    }
    setStudentUser(u)

    let isCancelled = false

    const joinAndLoad = async () => {
      // Make sure the browser's idea of "signed in" matches the server's
      const verified = await hybridStore.syncSession()
      if (isCancelled) return
      if (!verified || verified.role !== 'student') {
        router.replace(
          `/login?role=student&code=${code}&redirect=${encodeURIComponent(`/classroom/${code}/student`)}`
        )
        return
      }

      // Join the room with the signed-in student's real account
      const joined = await hybridStore.joinClassroom(code, verified)
      if (isCancelled) return
      if (joined.error) {
        if (joined.status === 404) {
          setClassroomNotFound(true)
        } else if (joined.status === 401) {
          router.replace(
            `/login?role=student&code=${code}&redirect=${encodeURIComponent(`/classroom/${code}/student`)}`
          )
        } else {
          setAccessMessage(joined.error)
          setClassroomNotFound(true)
        }
        return
      }

      const c = await hybridStore.getClassroomByCode(code)
      if (isCancelled) return
      if (!c) {
        setClassroomNotFound(true)
        return
      }

      setClassroom(c)
      setStudentCount((c.students || []).length || 1)
      if (c.screenshare && c.screenshare.is_sharing) {
        setActiveScreenShare(c.screenshare)
      }

      const transList = await hybridStore.getTranscripts(code)
      if (isCancelled) return
      setTranscripts(Array.isArray(transList) ? transList : [])

      const activePoll = await hybridStore.getActivePoll(code)
      if (!isCancelled && activePoll && activePoll.is_active) {
        setPollHasActive(true)
      }
    }

    joinAndLoad()

    // 2. Real-Time Synchronization via Server-Sent Events
    const unsubscribe = hybridStore.subscribe(code, (msg) => {
      // Live Final Transcript from Teacher
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
        setInterimText('')
        triggerVisualAlert()
      }

      // Live Interim Word-by-Word Streaming as Teacher Speaks
      if (msg.type === 'INTERIM_TRANSCRIPT') {
        setInterimText(msg.text || '')
      }

      if (msg.type === 'TRANSCRIPTS_CLEARED') {
        setTranscripts([])
        setInterimText('')
      }

      // Real-time Student Count updates
      if (msg.type === 'STUDENT_JOINED' || msg.type === 'STUDENT_REMOVED' || msg.type === 'STUDENTS_UPDATED') {
        if (msg.student_count !== undefined) {
          setStudentCount(msg.student_count)
        } else if (msg.students) {
          setStudentCount(msg.students.length)
        }
      }

      // Classroom Info Updated by Teacher
      if (msg.type === 'CLASSROOM_UPDATED' || msg.type === 'CLASSROOM_EDITED') {
        if (msg.classroom) setClassroom(msg.classroom)
      }

      // Real-time Student Removal / Kick Check
      if (msg.type === 'STUDENT_REMOVED') {
        if (msg.studentId === u.id) {
          setWasKicked(true)
        }
      }

      // Live Poll Launched
      if (msg.type === 'NEW_POLL') {
        setPollHasActive(true)
        setToastMessage('New Live Poll launched by Teacher! Click Polls to vote.')
        playNotificationSound()
      }

      // Quiz Session Launched
      if (msg.type === 'START_QUIZ') {
        setShowQuizModal(true)
        playNotificationSound()
      }

      // Resource / PDF Shared
      if (msg.type === 'NEW_RESOURCE') {
        const title = msg.resource?.title || 'Lecture Document'
        setToastMessage(`Teacher shared a new document: "${title}"`)
        playNotificationSound()
      }

      // Screen Share Event
      if (msg.type === 'SCREENSHARE_UPDATED') {
        setActiveScreenShare(msg.screenshare)
      }

      // Class Deleted by Teacher / Admin
      if (msg.type === 'CLASSROOM_DELETED') {
        alert('This classroom session was closed or removed by the instructor.')
        router.push('/student/dashboard')
      }

      // Class Ended
      if (msg.type === 'CLASSROOM_STATUS' && !msg.isActive) {
        setToastMessage('The teacher has concluded this lecture. Redirecting to summary...')
        setTimeout(() => {
          router.push(`/classroom/${code}/summary`)
        }, 2000)
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [code, router, playNotificationSound, triggerVisualAlert])

  // 3. Send Confirmed Hand Gesture to Teacher
  const handleGestureDetected = async (gestureData) => {
    if (!studentUser) return
    await hybridStore.sendGestureEvent(code, {
      student_id: studentUser.id,
      student_name: studentUser.name || studentUser.full_name || 'Student',
      ...gestureData,
    })

    setToastMessage(`Your sign "${gestureData.gesture_label}" was sent to ${classroom?.teacher_name || 'Teacher'}!`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // 4. Send Typed Question to Teacher
  const handleSendQuestion = async (e) => {
    e.preventDefault()
    if (!typedQuestion.trim() || !studentUser) return

    setQuestionSending(true)
    await hybridStore.sendStudentQuestion(code, {
      student_id: studentUser.id,
      student_name: studentUser.name || studentUser.full_name || 'Student',
      text: typedQuestion.trim(),
    })

    setToastMessage(`Question sent to ${classroom?.teacher_name || 'Teacher'}!`)
    setTypedQuestion('')
    setShowQuestionModal(false)
    setQuestionSending(false)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // 5. Student Screen Sharing
  const toggleStudentScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }
      setIsScreenSharing(false)
      await hybridStore.toggleScreenShare(code, {
        is_screen_sharing: false,
        shared_by: studentUser?.name || 'Student',
        role: 'student',
      })
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert('Screen sharing is not supported on this browser.')
          return
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = stream
        setIsScreenSharing(true)

        await hybridStore.toggleScreenShare(code, {
          is_screen_sharing: true,
          shared_by: studentUser?.name || 'Student',
          role: 'student',
        })

        stream.getVideoTracks()[0].onended = async () => {
          setIsScreenSharing(false)
          screenStreamRef.current = null
          await hybridStore.toggleScreenShare(code, {
            is_screen_sharing: false,
            shared_by: studentUser?.name || 'Student',
            role: 'student',
          })
        }
      } catch (err) {
        console.warn('Student screen share canceled:', err)
      }
    }
  }

  const handleLeaveClass = async () => {
    if (studentUser) {
      await hybridStore.removeStudentFromClassroom(code, studentUser.id)
    }
    router.push('/student/dashboard')
  }

  // CLASSROOM NOT FOUND
  if (classroomNotFound) {
    return (
      <ClassroomNotFound
        code={code}
        message={accessMessage || undefined}
        title={accessMessage ? 'Unable to Join Classroom' : undefined}
      />
    )
  }

  // EJECTION SCREEN IF KICKED BY TEACHER
  if (wasKicked) {
    return (
      <div className="min-h-screen bg-slate-900/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Session Ended by Instructor</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You have been removed from classroom <span className="font-mono font-bold">{code}</span> by the instructor.
          </p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-4">
          <Logo />

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {classroom?.name || 'Classroom Session'}
            </h1>
            <p className="text-xs text-slate-500">
              Instructor: <span className="font-semibold text-slate-700">{classroom?.teacher_name || 'Prof. Rahul Sharma'}</span>
            </p>
          </div>

          {/* Live indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-live-ping" />
            Live
          </div>

          {/* Student count */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{studentCount} student{studentCount === 1 ? '' : 's'}</span>
          </div>

          {/* Screen Share Alert Pill */}
          {activeScreenShare && activeScreenShare.is_sharing && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold animate-pulse">
              <Monitor className="w-3.5 h-3.5" />
              <span>{activeScreenShare.shared_by} sharing screen</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Ask Question (Typed) Button */}
          <button
            onClick={() => setShowQuestionModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Ask Question</span>
          </button>

          {/* Student Screen Share Button */}
          <button
            onClick={toggleStudentScreenShare}
            title={isScreenSharing ? 'Stop Sharing Screen' : 'Share My Screen'}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shadow-2xs ${
              isScreenSharing
                ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </button>

          {/* Interactive Feature Modals for Students */}
          <button
            onClick={() => setShowPollModal(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shadow-2xs ${
              pollHasActive
                ? 'bg-purple-600 text-white border-purple-600 animate-pulse'
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Poll</span>
            {pollHasActive && <span className="w-2 h-2 rounded-full bg-white" />}
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
            <span>PDFs</span>
          </button>

          <Link
            href="/settings"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="Accessibility Settings"
          >
            <Sliders className="w-4 h-4" />
          </Link>

          {/* Leave Class Button */}
          <button
            onClick={handleLeaveClass}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 rounded-xl transition"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md transition-all shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-100 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Classroom Workspace */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto">
        {/* Left Column: Live Captions Stream from Teacher */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[480px]">
          <TranscriptViewer
            transcripts={transcripts}
            interimText={interimText}
            isLive={true}
            title="Teacher Live Captions"
            onOpenSettings={() => router.push('/settings')}
          />
        </div>

        {/* Right Column: Sign Language Recognition & Student Controls */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[480px]">
          <MediaPipeGestureDetector
            activeClassroomCode={code}
            onGestureDetected={handleGestureDetected}
            onOpenQuestionModal={() => setShowQuestionModal(true)}
          />
        </div>
      </main>

      {/* Ask Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ask the Instructor a Question</h3>
                  <p className="text-xs text-slate-400">Your question will pop up directly on the teacher's screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendQuestion} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Type your question or doubt here (e.g. Could you explain dynamic API routing again?)..."
                value={typedQuestion}
                onChange={(e) => setTypedQuestion(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={questionSending || !typedQuestion.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 transition shadow-sm flex items-center gap-2 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{questionSending ? 'Sending...' : 'Send Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classroom Modals for Students */}
      <ClassroomPollModal
        code={code}
        role="student"
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
      />

      <ClassroomQuizModal
        code={code}
        role="student"
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />

      <ClassroomResourcesModal
        code={code}
        role="student"
        isOpen={showResourcesModal}
        onClose={() => setShowResourcesModal(false)}
      />
    </div>
  )
}
