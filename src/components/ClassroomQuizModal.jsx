'use client'

import React, { useState, useEffect } from 'react'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  X,
  Play,
  Plus,
  RotateCcw,
  BookOpen,
  BarChart,
  List,
} from 'lucide-react'

export default function ClassroomQuizModal({
  code,
  role = 'student',
  isOpen,
  onClose,
}) {
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [activeTab, setActiveTab] = useState('active') // 'active', 'list', 'create'

  // Teacher custom quiz form state
  const [customTitle, setCustomTitle] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [customOptions, setCustomOptions] = useState([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ])
  const [correctOption, setCorrectOption] = useState('A')
  const [customExplanation, setCustomExplanation] = useState('')
  const [customTimer, setCustomTimer] = useState(30)

  const loadQuizzes = async () => {
    if (!code) return
    const list = await hybridStore.getQuizzes(code)
    const safeList = Array.isArray(list) ? list : []
    setQuizzes(safeList)
    const active = safeList.find((q) => q.is_active) || null
    setActiveQuiz(active)
    if (active) {
      setTimeLeft(active.timer_seconds || 30)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    loadQuizzes()

    const unsubscribe = hybridStore.subscribe(code, (msg) => {
      if (
        msg.type === 'START_QUIZ' ||
        msg.type === 'QUIZ_ANSWERED' ||
        msg.type === 'QUIZ_CLOSED' ||
        msg.type === 'QUIZZES_UPDATED'
      ) {
        loadQuizzes()
        if (msg.type === 'START_QUIZ') {
          setSelectedOption(null)
          setSubmitted(false)
          setScore(null)
          setActiveTab('active')
        }
      }
    })
    return () => unsubscribe()
  }, [code, isOpen])

  // Timer countdown
  useEffect(() => {
    if (!activeQuiz || !activeQuiz.is_active || timeLeft <= 0 || submitted) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [activeQuiz, timeLeft, submitted])

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !activeQuiz || submitted) return
    const user = hybridStore.getCurrentUser()
    const chosen = activeQuiz.options.find((o) => o.id === selectedOption)
    const isCorrect = chosen?.isCorrect ?? false
    setScore(isCorrect ? 100 : 0)
    setSubmitted(true)
    await hybridStore.submitQuizAnswer(code, activeQuiz.id, {
      student_id: user?.id,
      student_name: user?.name || user?.full_name || 'Student',
      selected_option: selectedOption,
      is_correct: isCorrect,
    })
  }

  const handleLaunchQuiz = async (quizId) => {
    const launched = await hybridStore.launchQuiz(code, quizId)
    if (launched) {
      setActiveQuiz(launched)
      setTimeLeft(launched.timer_seconds || 30)
    }
    setSubmitted(false)
    setSelectedOption(null)
    setActiveTab('active')
  }

  const handleCreateCustomQuiz = async (e) => {
    e.preventDefault()
    if (!customQuestion.trim() || !customTitle.trim()) return

    const formattedOptions = customOptions.map((opt) => ({
      id: opt.id,
      text: opt.text.trim(),
      isCorrect: opt.id === correctOption,
    }))

    const newQ = await hybridStore.createQuiz(code, {
      title: customTitle.trim(),
      subject: customSubject.trim() || 'General',
      question: customQuestion.trim(),
      options: formattedOptions,
      explanation: customExplanation.trim() || 'Answer verified by educator.',
      timer_seconds: customTimer,
    })

    if (newQ) {
      setActiveQuiz(newQ)
      setTimeLeft(customTimer)
      setSubmitted(false)
      setSelectedOption(null)
      setActiveTab('active')
    }

    // Reset form
    setCustomTitle('')
    setCustomSubject('')
    setCustomQuestion('')
    setCustomExplanation('')
    await loadQuizzes()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Classroom Quiz Arena</h3>
              <p className="text-xs text-slate-500">Interactive live subject knowledge checks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Teacher Navigation Tabs */}
        {role === 'teacher' && (
          <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-100 shrink-0">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'active'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active Quiz {activeQuiz && '• Live'}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Quiz Bank ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Custom Quiz
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* TAB 1: ACTIVE QUIZ (FOR STUDENTS AND TEACHER) */}
          {activeTab === 'active' && (
            activeQuiz && activeQuiz.is_active ? (
              <div className="space-y-4">
                {/* Question card */}
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      {activeQuiz.title || 'Knowledge Check'} • {activeQuiz.subject || 'Subject'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s remaining</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {activeQuiz.question}
                  </h4>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {activeQuiz.options.map((opt) => {
                    const isSelected = selectedOption === opt.id
                    const isCorrect = opt.isCorrect

                    let optStyle = 'border-slate-200 hover:border-amber-300 bg-white'
                    if (submitted) {
                      if (isCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                      } else if (isSelected && !isCorrect) {
                        optStyle = 'border-rose-400 bg-rose-50 text-rose-900'
                      }
                    } else if (isSelected) {
                      optStyle = 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={submitted || timeLeft <= 0}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between text-xs font-medium ${optStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold flex items-center justify-center shrink-0">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {submitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {submitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Explanation on submit */}
                {submitted && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      {score === 100 ? (
                        <span className="text-emerald-600">✓ Correct Answer! (+100 Points)</span>
                      ) : (
                        <span className="text-rose-600">✕ Incorrect Answer</span>
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{activeQuiz.explanation}</p>
                  </div>
                )}

                {/* Student submit button */}
                {role === 'student' && !submitted && (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || timeLeft <= 0}
                    className="w-full py-3 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {timeLeft <= 0 ? 'Time Expired' : 'Submit Answer'}
                  </button>
                )}

                {/* Teacher stats and control */}
                {role === 'teacher' && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Student submissions:{' '}
                      {Object.values(activeQuiz.results || {}).reduce((a, b) => a + b, 0)}
                    </span>
                    <button
                      onClick={() => hybridStore.closeQuiz(code)}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                    >
                      End Active Quiz
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Quiz Active Right Now</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {role === 'teacher'
                    ? 'Choose a quiz from the Quiz Bank or create your own custom subject quiz!'
                    : 'The instructor will launch interactive subject quizzes during class.'}
                </p>
                {role === 'teacher' && (
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      onClick={() => setActiveTab('list')}
                      className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-xs"
                    >
                      Browse Quiz Bank ({quizzes.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      Create Custom Quiz
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* TAB 2: QUIZ BANK (TEACHER VIEW) */}
          {role === 'teacher' && activeTab === 'list' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select a Quiz to Launch to Students ({quizzes.length})
              </p>
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 bg-white transition flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {q.subject || 'General'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{q.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{q.question}</p>
                    </div>

                    <button
                      onClick={() => handleLaunchQuiz(q.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                        q.is_active
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {q.is_active ? 'Active Now' : 'Launch Quiz'}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1 border-t border-slate-100">
                    <span>{q.options?.length || 4} options</span>
                    <span>•</span>
                    <span>Timer: {q.timer_seconds}s</span>
                    <span>•</span>
                    <span>Responses: {Object.values(q.results || {}).reduce((a, b) => a + b, 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CREATE CUSTOM QUIZ (TEACHER VIEW) */}
          {role === 'teacher' && activeTab === 'create' && (
            <form onSubmit={handleCreateCustomQuiz} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 3 Checkpoint"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Web Development"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter the quiz question for your students..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Options & Correct Answer
                </label>
                {customOptions.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-xs flex items-center justify-center shrink-0">
                      {opt.id}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${opt.id} text`}
                      value={opt.text}
                      onChange={(e) => {
                        const copy = [...customOptions]
                        copy[i].text = e.target.value
                        setCustomOptions(copy)
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <label className="flex items-center gap-1 text-[11px] text-slate-600 shrink-0 cursor-pointer">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={correctOption === opt.id}
                        onChange={() => setCorrectOption(opt.id)}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span>Correct</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Timer Duration
                  </label>
                  <select
                    value={customTimer}
                    onChange={(e) => setCustomTimer(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={15}>15 Seconds</option>
                    <option value={30}>30 Seconds</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Answer Explanation
                  </label>
                  <input
                    type="text"
                    placeholder="Short note why answer is correct"
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-xs flex items-center justify-center gap-2 mt-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Save & Launch Quiz to Class
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
