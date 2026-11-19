'use client'

import React, { useState, useEffect } from 'react'
import { hybridStore } from '@/lib/supabase/hybridStore'
import { BarChart2, Plus, CheckCircle2, X, AlertCircle, Play, Vote } from 'lucide-react'

export default function ClassroomPollModal({
  code,
  role = 'student',
  isOpen,
  onClose,
}) {
  const [activePoll, setActivePoll] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [options, setOptions] = useState(['Yes, fully clear', 'Need another example', 'No, need help'])
  const [isCreating, setIsCreating] = useState(false)

  const loadPoll = async () => {
    if (!code) return
    const p = await hybridStore.getActivePoll(code)
    setActivePoll(p)
  }

  useEffect(() => {
    if (!isOpen) return
    loadPoll()

    const unsubscribe = hybridStore.subscribe(code, (msg) => {
      if (
        msg.type === 'NEW_POLL' ||
        msg.type === 'POLL_VOTED' ||
        msg.type === 'POLL_CLOSED'
      ) {
        if (msg.poll) {
          setActivePoll(msg.poll)
        } else {
          loadPoll()
        }
      }
    })
    return () => unsubscribe()
  }, [code, isOpen])

  const handleVote = async () => {
    if (!selectedOption || !activePoll) return
    const user = hybridStore.getCurrentUser()
    const updated = await hybridStore.votePoll(code, activePoll.id, selectedOption, user?.id)
    if (updated) setActivePoll(updated)
    setHasVoted(true)
  }

  const handleCreatePoll = async (e) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    const filteredOptions = options.filter((o) => o.trim().length > 0)
    if (filteredOptions.length < 2) return

    const poll = await hybridStore.createPoll(code, {
      question: newQuestion.trim(),
      options: filteredOptions,
    })
    setActivePoll(poll)
    setIsCreating(false)
    setNewQuestion('')
  }

  const handleEndPoll = async () => {
    if (!activePoll) return
    const updated = await hybridStore.closePoll(code, activePoll.id)
    setActivePoll(updated || null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Live Classroom Poll</h3>
              <p className="text-xs text-slate-500">Real-time student comprehension checks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5">
          {/* TEACHER: Create new poll view */}
          {role === 'teacher' && isCreating ? (
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Poll Question
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Do you understand how Dynamic Routing works?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Answer Options
                </label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const copy = [...options]
                        copy[i] = e.target.value
                        setOptions(copy)
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  ))}
                </div>
              </div>

              {/* Template quick-fills */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400">Quick Templates:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNewQuestion('Pacing Check: How is the lecture speed?')
                      setOptions(['Too fast, please slow down', 'Just right', 'Can go faster'])
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                  >
                    Pacing Check
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewQuestion('Should we do a live coding demonstration next?')
                      setOptions(['Yes, show code demo', 'Explain theory first', 'Review quiz'])
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                  >
                    Next Activity
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm"
                >
                  Launch Poll to Students
                </button>
              </div>
            </form>
          ) : activePoll ? (
            /* ACTIVE POLL RESULTS & VOTING */
            <div className="space-y-4">
              <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                    {activePoll.is_active ? 'Live Poll in Progress' : 'Poll Closed'}
                  </span>
                  <span className="text-xs text-purple-700 font-medium">
                    {activePoll.total_votes || 0} votes
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {activePoll.question}
                </h4>
              </div>

              {/* Options list */}
              <div className="space-y-3">
                {activePoll.options.map((opt) => {
                  const percentage =
                    activePoll.total_votes > 0
                      ? Math.round(((opt.votes || 0) / activePoll.total_votes) * 100)
                      : 0

                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (role === 'student' && activePoll.is_active && !hasVoted) {
                          setSelectedOption(opt.id)
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition relative overflow-hidden ${
                        role === 'student' && activePoll.is_active && !hasVoted
                          ? selectedOption === opt.id
                            ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20 cursor-pointer'
                            : 'border-slate-200 hover:border-purple-300 bg-white cursor-pointer'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      {/* Background fill bar for percentage */}
                      <div
                        className="absolute inset-y-0 left-0 bg-purple-100/70 transition-all duration-500 rounded-l-xl -z-0"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{opt.text}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-purple-700">{percentage}%</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({opt.votes || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Student submit vote button */}
              {role === 'student' && activePoll.is_active && (
                <div className="pt-2">
                  {hasVoted ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Your vote has been submitted! Live results updating above.
                    </div>
                  ) : (
                    <button
                      onClick={handleVote}
                      disabled={!selectedOption}
                      className="w-full py-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Vote className="w-4 h-4" />
                      Submit My Vote
                    </button>
                  )}
                </div>
              )}

              {/* Teacher actions */}
              {role === 'teacher' && (
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  {activePoll.is_active ? (
                    <button
                      onClick={handleEndPoll}
                      className="flex-1 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                    >
                      Close Poll
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Poll is closed</span>
                  )}
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    New Question
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-3">
              <BarChart2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No active poll right now</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {role === 'teacher'
                  ? 'Ask students a live multiple choice question to gauge comprehension.'
                  : 'Your instructor will launch live comprehension polls here.'}
              </p>
              {role === 'teacher' && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                  Create First Poll
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
