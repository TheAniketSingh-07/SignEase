'use client'

import React, { useState, useEffect } from 'react'
import { hybridStore } from '@/lib/supabase/hybridStore'
import {
  Users,
  UserX,
  Edit,
  Save,
  CheckCircle2,
  X,
  Shield,
  Video,
  VideoOff,
  Bell,
  BellOff,
} from 'lucide-react'

export default function ClassroomParticipantsModal({
  code,
  classroom,
  isOpen,
  onClose,
  onClassroomUpdated,
}) {
  const [students, setStudents] = useState([])
  const [activeTab, setActiveTab] = useState('students') // 'students' or 'edit_class'
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)
  const [removeSuccessMsg, setRemoveSuccessMsg] = useState('')

  const loadStudents = async () => {
    if (!code) return
    const list = await hybridStore.getClassroomStudents(code)
    setStudents(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    if (!isOpen) return
    loadStudents()

    if (classroom) {
      setName(classroom.name || '')
      setSubject(classroom.subject || '')
      setDescription(classroom.description || '')
    }

    const unsubscribe = hybridStore.subscribe(code, (msg) => {
      if (
        msg.type === 'STUDENT_JOINED' ||
        msg.type === 'STUDENT_REMOVED' ||
        msg.type === 'STUDENTS_UPDATED'
      ) {
        loadStudents()
      }
    })
    return () => unsubscribe()
  }, [code, classroom, isOpen])

  const handleRemoveStudent = async (studentId, studentName) => {
    if (confirm(`Are you sure you want to remove ${studentName} from this classroom?`)) {
      await hybridStore.removeStudentFromClassroom(code, studentId)
      await loadStudents()
      setRemoveSuccessMsg(`Removed ${studentName} from the classroom.`)
      setTimeout(() => setRemoveSuccessMsg(''), 3000)
    }
  }

  const handleSaveClassroomEdit = async (e) => {
    e.preventDefault()
    const updated = await hybridStore.updateClassroom(code, {
      name,
      subject,
      description,
    })
    setEditSuccess(true)
    setTimeout(() => setEditSuccess(false), 2500)
    if (onClassroomUpdated) onClassroomUpdated(updated)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Classroom Administration</h3>
              <p className="text-xs text-slate-500">Manage participants and lecture settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'students'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Connected Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('edit_class')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'edit_class'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Classroom Info
          </button>
        </div>

        {removeSuccessMsg && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <span>{removeSuccessMsg}</span>
          </div>
        )}

        {/* Tab 1: Real Students Roster with Remove Button */}
        {activeTab === 'students' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {students.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No students currently connected to this session. Students joining with code will appear here.
              </p>
            ) : (
              students.map((st) => {
                const displayName = st.name || st.full_name || 'Student'
                return (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200">
                        {displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{displayName}</h4>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active in session" />
                        </div>
                        <p className="text-[11px] text-slate-400">{st.email || 'student@classroom.edu'}</p>
                        <p className="text-[10px] text-slate-400">Joined at {st.joined_at || 'Just now'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveStudent(st.id, displayName)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                        title="Remove student from classroom"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab 2: Edit Classroom Info on the Fly */}
        {activeTab === 'edit_class' && (
          <form onSubmit={handleSaveClassroomEdit} className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Class Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject / Topic
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {editSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Classroom details updated in real time for all students!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Classroom Changes
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
