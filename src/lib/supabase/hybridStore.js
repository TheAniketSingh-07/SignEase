'use client'

import { generateRoomCode, getTimestampString } from '../utils'

const STORAGE_KEY_AUTH = 'signease_auth_user'

class UnifiedClientStore {
  constructor() {
    this.currentUser = null
    this.activeSSE = null
    this.sseRoomCode = null
    this.listeners = new Set()

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_AUTH)
        if (stored) {
          this.currentUser = JSON.parse(stored)
        }
      } catch (e) {}
    }
  }

  // ================= AUTHENTICATION =================
  getCurrentUser() {
    if (this.currentUser) return this.currentUser
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH)
      if (stored) {
        this.currentUser = JSON.parse(stored)
        return this.currentUser
      }
    } catch (e) {}
    return null
  }

  setCurrentUser(user) {
    this.currentUser = user
    if (typeof window === 'undefined') return
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_AUTH)
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user))
    }
    this._notifyListeners({ type: 'AUTH_CHANGED', user })
  }

  async login(email, password, role = 'teacher') {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid email or password.')
      }

      this.setCurrentUser(data.user)
      return { user: data.user, error: null }
    } catch (err) {
      return { user: null, error: err }
    }
  }

  async register(fullName, email, password, role = 'teacher') {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Registration failed.')
      }

      // Automatically log in after registration
      return await this.login(email, password, role)
    } catch (err) {
      return { user: null, error: err }
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {}
    this.setCurrentUser(null)
  }

  /**
   * Ask the server who is really signed in. The browser copy of the user (localStorage)
   * can be stale - e.g. the session expired or the cookie was cleared - which used to
   * make every API call fail with confusing "invalid" errors.
   * Returns the verified user, or null.
   */
  async syncSession() {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      if (data?.user) {
        this.setCurrentUser(data.user)
        return data.user
      }
    } catch (e) {
      // Server unreachable: keep whatever we have rather than logging the user out
      return this.getCurrentUser()
    }
    if (this.getCurrentUser()) this.setCurrentUser(null)
    return null
  }

  updateProfile(updates) {
    const current = this.getCurrentUser() || {}
    const updated = { ...current, ...updates }
    this.setCurrentUser(updated)
    return updated
  }

  // ================= CLASSROOMS (REAL SERVER API) =================
  async fetchClassrooms(filter = {}) {
    try {
      const query = new URLSearchParams()
      if (filter.teacherId) query.set('teacherId', filter.teacherId)
      if (filter.studentId) query.set('studentId', filter.studentId)

      const res = await fetch(`/api/classrooms?${query.toString()}`, { cache: 'no-store' })
      if (res.status === 401) {
        this.setCurrentUser(null)
        return []
      }
      const data = await res.json()
      return data.classrooms || []
    } catch (e) {
      return []
    }
  }

  async getClassroomByCode(code) {
    if (!code) return null
    try {
      const cleanCode = code.toUpperCase().trim()
      const res = await fetch(`/api/classrooms/${cleanCode}`, { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json()
      return data.classroom || null
    } catch (e) {
      return null
    }
  }

  async createClassroom({ name, subject, description, scheduledDate }) {
    const res = await fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        subject,
        description,
        scheduledDate,
      }),
    })
    const data = await res.json()
    if (res.status === 401) this.setCurrentUser(null)
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to create classroom.')
    }
    return data.classroom
  }

  async updateClassroom(code, updates) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    return data.classroom
  }

  async deleteClassroom(code) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    return data.success
  }

  async updateClassroomStatus(code, isActive) {
    return await this.updateClassroom(code, {
      is_active: isActive,
      ended_at: !isActive ? getTimestampString() : null,
    })
  }

  async joinClassroom(code, studentUser) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        return {
          classroom: null,
          status: res.status,
          error: data.error || 'Failed to join classroom',
        }
      }
      return { classroom: data.classroom, status: res.status, error: null }
    } catch (e) {
      return { classroom: null, status: 0, error: 'Could not reach the server. Check your connection.' }
    }
  }

  async addStudentToClassroom(code, studentUser) {
    return await this.joinClassroom(code, studentUser)
  }

  async getClassroomStudents(code) {
    const classroom = await this.getClassroomByCode(code)
    return classroom?.students || []
  }

  async removeStudentFromClassroom(code, studentId) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
    const data = await res.json()
    return data.students
  }

  // ================= TRANSCRIPTS =================
  async getTranscripts(code) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/transcript`)
      if (!res.ok) return []
      const data = await res.json()
      return data.transcripts || []
    } catch (e) {
      return []
    }
  }

  async addTranscriptItem(code, item) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker: item.speaker || 'Teacher',
          text: item.text,
          timestamp: item.timestamp || getTimestampString(),
          isInterim: false,
        }),
      })
      const data = await res.json()
      return data.item
    } catch (e) {
      return null
    }
  }

  broadcastInterimTranscript(code, text) {
    const cleanCode = code.toUpperCase().trim()
    // Fire and forget lightweight interim word streaming
    fetch(`/api/classrooms/${cleanCode}/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, isInterim: true }),
    }).catch(() => {})
  }

  async clearTranscripts(code) {
    const cleanCode = code.toUpperCase().trim()
    await fetch(`/api/classrooms/${cleanCode}/transcript`, {
      method: 'DELETE',
    }).catch(() => {})
  }

  // ================= GESTURES =================
  async sendGestureEvent(code, gestureData) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/gesture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gestureData),
      })
      const data = await res.json()
      return data.event
    } catch (e) {
      return null
    }
  }

  // ================= STUDENT TYPED QUESTIONS =================
  async sendStudentQuestion(code, { student_id, student_name, text }) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, student_name, text }),
      })
      const data = await res.json()
      return data.question
    } catch (e) {
      return null
    }
  }

  // ================= POLLS =================
  async getPolls(code) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/polls`)
      const data = await res.json()
      return data.polls || []
    } catch (e) {
      return []
    }
  }

  async createPoll(code, { question, options }) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options }),
    })
    const data = await res.json()
    return data.poll
  }

  async votePoll(code, pollId, optionId, studentId) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/polls`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId, studentId }),
    })
    const data = await res.json()
    return data.poll
  }

  async closePoll(code, pollId) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/polls`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId }),
    })
    const data = await res.json()
    return data.poll
  }

  async getActivePoll(code) {
    const polls = await this.getPolls(code)
    return polls.find((p) => p.is_active) || null
  }

  // ================= QUIZZES =================
  async getQuizzes(code) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/quizzes`)
      const data = await res.json()
      return data.quizzes || []
    } catch (e) {
      return []
    }
  }

  async createQuiz(code, quizData) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData),
    })
    const data = await res.json()
    return data.quiz
  }

  async launchQuiz(code, quizId) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'launch', quizId }),
    })
    const data = await res.json()
    return data.quiz
  }

  async submitQuizAnswer(code, quizId, { student_id, student_name, selected_option, is_correct }) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/quizzes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, student_id, student_name, selected_option, is_correct }),
    })
    const data = await res.json()
    return data.quiz
  }

  async closeQuiz(code, quizId) {
    const cleanCode = code.toUpperCase().trim()
    await fetch(`/api/classrooms/${cleanCode}/quizzes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    }).catch(() => {})
  }

  // ================= RESOURCES (PDFs) =================
  async getResources(code) {
    const cleanCode = code.toUpperCase().trim()
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/resources`)
      const data = await res.json()
      return data.resources || []
    } catch (e) {
      return []
    }
  }

  async uploadResource(code, resourceData) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resourceData),
    })
    const data = await res.json()
    return data.resource
  }

  async deleteResource(code, resourceId) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/resources`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId }),
    })
    const data = await res.json()
    return data.success
  }

  // ================= MEDIA & SCREEN SHARE =================
  async updateMediaState(code, { userId, role, is_camera_on, is_mic_on, is_screen_sharing }) {
    const cleanCode = code.toUpperCase().trim()
    fetch(`/api/classrooms/${cleanCode}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role, is_camera_on, is_mic_on, is_screen_sharing }),
    }).catch(() => {})
  }

  async toggleScreenShare(code, { is_screen_sharing, shared_by, role }) {
    const cleanCode = code.toUpperCase().trim()
    const res = await fetch(`/api/classrooms/${cleanCode}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'screenshare',
        is_screen_sharing,
        shared_by,
        role,
      }),
    })
    const data = await res.json()
    return data.screenshare
  }

  // ================= REAL-TIME SERVER-SENT EVENTS (SSE) =================
  subscribe(code, callback) {
    if (typeof window === 'undefined') return () => {}

    const cleanCode = code ? code.toUpperCase().trim() : null
    this.listeners.add(callback)

    let eventSource = null
    let stopped = false
    let retryTimer = null
    let retryDelay = 1000

    const handle = (event) => {
      try {
        const payload = JSON.parse(event.data)
        // Safety net: ignore anything that belongs to a different classroom
        if (cleanCode && payload.code && payload.code !== cleanCode) return
        callback({ ...payload, type: payload.type, payload })
      } catch (e) {}
    }

    const connect = () => {
      if (stopped) return
      try {
        const url = cleanCode ? `/api/realtime?code=${cleanCode}` : '/api/realtime'
        eventSource = new EventSource(url)

        eventSource.addEventListener('connected', () => {
          retryDelay = 1000
        })
        eventSource.addEventListener('message', handle)
        eventSource.addEventListener('global', handle)

        eventSource.onerror = () => {
          // The browser retries by itself while the connection is merely interrupted.
          // If it gave up (CLOSED - e.g. the server answered with an error because the
          // student had not finished joining yet), reconnect manually with backoff.
          if (eventSource && eventSource.readyState === 2 && !stopped) {
            eventSource.close()
            clearTimeout(retryTimer)
            retryTimer = setTimeout(connect, retryDelay)
            retryDelay = Math.min(retryDelay * 2, 10000)
          }
        }
      } catch (err) {
        console.warn('SSE connection init note:', err)
      }
    }

    connect()

    return () => {
      stopped = true
      clearTimeout(retryTimer)
      this.listeners.delete(callback)
      if (eventSource) eventSource.close()
    }
  }

  _notifyListeners(event) {
    this.listeners.forEach((cb) => {
      try {
        cb(event)
      } catch (e) {}
    })
  }
}

export const hybridStore = new UnifiedClientStore()
