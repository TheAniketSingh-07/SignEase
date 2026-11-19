import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const DATA_FILE = path.join(process.cwd(), 'data', 'signease.json')
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ================= PASSWORDS =================
// New hashes use scrypt with a per-user random salt: "scrypt$<salt>$<hash>".
// Legacy hashes (fixed-salt PBKDF2 from older versions) are still accepted and
// are transparently upgraded the next time that user logs in.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function legacyHash(password) {
  return crypto.pbkdf2Sync(password, 'signease_salt_2026', 1000, 64, 'sha512').toString('hex')
}

function safeEqualHex(a, b) {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false
  try {
    if (stored.startsWith('scrypt$')) {
      const [, salt, hash] = stored.split('$')
      const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
      return safeEqualHex(candidate, hash)
    }
    return safeEqualHex(legacyHash(password), stored)
  } catch {
    return false
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function getDefaultDB() {
  const teacherId = 'user_teacher_demo'
  const studentId = 'user_student_demo'

  return {
    users: [
      {
        id: teacherId,
        name: 'Prof. Rahul Sharma',
        email: 'teacher@signease.edu',
        passwordHash: hashPassword('password123'),
        role: 'teacher',
        createdAt: new Date().toISOString(),
      },
      {
        id: studentId,
        name: 'Aarav Patel',
        email: 'student@signease.edu',
        passwordHash: hashPassword('password123'),
        role: 'student',
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: {},
    classrooms: [
      {
        id: 'c-web-dev',
        code: 'NXJS428',
        name: 'Web Development',
        subject: 'Next.js Fundamentals',
        description: 'Introduction to API Routes, Server Components, and Dynamic Routing.',
        teacher_id: teacherId,
        teacher_name: 'Prof. Rahul Sharma',
        is_active: true,
        scheduled_date: new Date().toISOString().split('T')[0],
        started_at: '10:00 AM',
        ended_at: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        students: [], // NO fake students! Real users who join will appear here.
        transcripts: [],
        gestures: [],
        questions: [],
        polls: [],
        quizzes: [
          {
            id: 'quiz-nextjs-1',
            title: 'Next.js App Router Architecture',
            subject: 'Next.js',
            question: 'Where do Server Components execute in a Next.js App Router project?',
            options: [
              { id: 'A', text: 'In the client browser JavaScript bundle' },
              { id: 'B', text: 'Exclusively on the server without client JS', isCorrect: true },
              { id: 'C', text: 'Inside a web worker thread' },
              { id: 'D', text: 'In the user cookies' },
            ],
            explanation: 'Server Components run strictly on the server and stream lightweight HTML to the client.',
            timer_seconds: 30,
            is_active: false,
            responses: [],
          },
          {
            id: 'quiz-asl-1',
            title: 'Sign Language Detection Basics',
            subject: 'Accessibility',
            question: 'Which gesture in SignEase alerts the instructor that a student has a question?',
            options: [
              { id: 'A', text: 'Thumbs down' },
              { id: 'B', text: 'Upright index finger (? QUESTION)', isCorrect: true },
              { id: 'C', text: 'Closed fist' },
              { id: 'D', text: 'Wave horizontally' },
            ],
            explanation: 'Raising an index finger points upwards and triggers the ? QUESTION alert to the teacher.',
            timer_seconds: 25,
            is_active: false,
            responses: [],
          },
        ],
        resources: [
          {
            id: 'res-default-1',
            title: 'Next.js App Router Architecture Guide.pdf',
            fileName: 'Next.js-App-Router-Guide.pdf',
            fileType: 'pdf',
            fileSize: '2.4 MB',
            description: 'Comprehensive guide to Server Components, Layouts, and API Route Handlers.',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            uploaded_by: 'Prof. Rahul Sharma',
            uploaded_at: '10:05 AM',
          },
          {
            id: 'res-default-2',
            title: 'Sign Language Gesture Reference Sheet.pdf',
            fileName: 'SignEase-Gesture-Reference.pdf',
            fileType: 'pdf',
            fileSize: '1.8 MB',
            description: 'Reference sheet for all 8 supported classroom hand gestures and meanings.',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            uploaded_by: 'Prof. Rahul Sharma',
            uploaded_at: '10:06 AM',
          },
        ],
        screenshare: {
          is_sharing: false,
          shared_by: null,
          role: null,
        },
      },
    ],
  }
}

// ================= STORAGE =================
// IMPORTANT: Next.js bundles every API route separately, so a plain module-level
// variable would give each route its OWN copy of the database (a class created in
// one route would then look "not found" in another). Keeping the cache on
// globalThis guarantees that every route shares exactly one copy per process.
if (!globalThis.__signease_db) {
  globalThis.__signease_db = { data: null, mtimeMs: 0 }
}
const store = globalThis.__signease_db

function normalizeDB(db) {
  db.users = Array.isArray(db.users) ? db.users : []
  db.classrooms = Array.isArray(db.classrooms) ? db.classrooms : []
  db.sessions = db.sessions && typeof db.sessions === 'object' ? db.sessions : {}
  return db
}

export function readDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stat = fs.statSync(DATA_FILE)
      // Reload only if the file changed on disk (e.g. edited by hand / another process)
      if (!store.data || stat.mtimeMs !== store.mtimeMs) {
        store.data = normalizeDB(JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')))
        store.mtimeMs = stat.mtimeMs
      }
      return store.data
    }
  } catch (err) {
    console.error('Failed reading DB file:', err)
    if (store.data) return store.data
  }
  if (!store.data) {
    store.data = normalizeDB(getDefaultDB())
    writeDB(store.data)
  }
  return store.data
}

export function writeDB(data) {
  store.data = data
  try {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    // Atomic write: a crash mid-write can never leave a half-written JSON file.
    const tmp = `${DATA_FILE}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmp, DATA_FILE)
    store.mtimeMs = fs.statSync(DATA_FILE).mtimeMs
  } catch (err) {
    console.error('Failed writing DB file:', err)
  }
}

export function normalizeCode(code) {
  const clean = String(code || '').toUpperCase().trim()
  return /^[A-Z0-9]{3,12}$/.test(clean) ? clean : ''
}

// ================= AUTHENTICATION & USERS =================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createUser({ name, email, password, role }) {
  const db = readDB()
  const cleanEmail = String(email || '').toLowerCase().trim()
  const cleanName = String(name || '').trim()

  if (!cleanName) throw new Error('Please enter your full name.')
  if (!EMAIL_RE.test(cleanEmail)) throw new Error('Please enter a valid email address.')
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long.')

  const existing = db.users.find((u) => u.email === cleanEmail)
  if (existing) {
    if (existing.googleId && !existing.passwordHash) {
      throw new Error('This email is already registered with Google. Please use "Continue with Google".')
    }
    throw new Error('An account with this email already exists.')
  }

  const user = {
    id: 'user_' + crypto.randomUUID().slice(0, 8),
    name: cleanName.slice(0, 80),
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: role === 'teacher' ? 'teacher' : 'student',
    createdAt: new Date().toISOString(),
  }

  db.users.push(user)
  writeDB(db)
  return sanitizeUser(user)
}

export function createSession(userId) {
  const db = readDB()
  const now = Date.now()

  // Drop expired sessions so the file doesn't grow forever
  for (const [key, s] of Object.entries(db.sessions)) {
    if (!s?.createdAt || now - new Date(s.createdAt).getTime() > SESSION_TTL_MS) {
      delete db.sessions[key]
    }
  }

  const token = 'token_' + crypto.randomBytes(32).toString('hex')
  // Only a hash of the token is stored on disk
  db.sessions[sha256(token)] = { userId, createdAt: new Date().toISOString() }
  writeDB(db)
  return token
}

export function authenticateUser(email, password) {
  const db = readDB()
  const cleanEmail = String(email || '').toLowerCase().trim()
  const user = db.users.find((u) => u.email === cleanEmail)

  if (!user) throw new Error('Invalid email or password.')
  if (!user.passwordHash) {
    throw new Error('This account was created with Google. Please click "Continue with Google" to sign in.')
  }
  if (!verifyPassword(password || '', user.passwordHash)) {
    throw new Error('Invalid email or password.')
  }

  // Upgrade legacy hashes on successful login
  if (!user.passwordHash.startsWith('scrypt$')) {
    user.passwordHash = hashPassword(password)
    writeDB(db)
  }

  const token = createSession(user.id)
  return { user: sanitizeUser(user), token }
}

/**
 * Sign in (or sign up) a user who has been verified by Google.
 * - Existing Google account  -> log in
 * - Existing email/password account with the same (Google-verified) email -> link & log in
 * - Otherwise -> create a new account with the role chosen on the login screen
 */
export function findOrCreateGoogleUser({ googleId, email, name, picture, role }) {
  const db = readDB()
  const cleanEmail = String(email || '').toLowerCase().trim()
  if (!googleId || !cleanEmail) throw new Error('Google did not return a valid account.')

  let user = db.users.find((u) => u.googleId === googleId)
  if (!user) user = db.users.find((u) => u.email === cleanEmail)

  let isNew = false
  if (user) {
    user.googleId = googleId
    if (picture) user.picture = picture
    if (!user.name && name) user.name = name
  } else {
    isNew = true
    user = {
      id: 'user_' + crypto.randomUUID().slice(0, 8),
      name: (name || cleanEmail.split('@')[0]).trim().slice(0, 80),
      email: cleanEmail,
      passwordHash: null,
      googleId,
      picture: picture || null,
      role: role === 'teacher' ? 'teacher' : 'student',
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
  }

  writeDB(db)
  const token = createSession(user.id)
  return { user: sanitizeUser(user), token, isNew }
}

export function getUserFromToken(token) {
  if (!token) return null
  const db = readDB()
  const session = db.sessions[sha256(token)]
  if (!session) return null

  if (Date.now() - new Date(session.createdAt).getTime() > SESSION_TTL_MS) {
    delete db.sessions[sha256(token)]
    writeDB(db)
    return null
  }

  const user = db.users.find((u) => u.id === session.userId)
  return user ? sanitizeUser(user) : null
}

export function deleteSession(token) {
  if (!token) return
  const db = readDB()
  const key = sha256(token)
  if (db.sessions[key]) {
    delete db.sessions[key]
    writeDB(db)
  }
}

function sanitizeUser(user) {
  const { passwordHash, googleId, ...clean } = user
  return {
    ...clean,
    name: clean.name,
    full_name: clean.name,
  }
}

// ================= CLASSROOMS =================
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1

function generateUniqueCode(db) {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = ''
    for (let i = 0; i < 7; i++) {
      code += CODE_CHARS.charAt(crypto.randomInt(CODE_CHARS.length))
    }
    if (!db.classrooms.some((c) => c.code.toUpperCase() === code)) return code
  }
  throw new Error('Could not generate a unique classroom code. Please try again.')
}

export function createClassroom({ name, subject, description, teacherId, teacherName, scheduledDate }) {
  const db = readDB()
  const code = generateUniqueCode(db)

  const now = new Date()
  const classroom = {
    id: 'c_' + crypto.randomUUID().slice(0, 8),
    code,
    name: name.trim(),
    subject: subject?.trim() || 'General',
    description: description?.trim() || '',
    teacher_id: teacherId,
    teacher_name: teacherName,
    is_active: true,
    scheduled_date: scheduledDate || now.toISOString().split('T')[0],
    started_at: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ended_at: null,
    created_at: now.toISOString(),
    students: [], // Starts completely clean: only real users who join appear here
    member_ids: [],
    transcripts: [],
    gestures: [],
    questions: [],
    polls: [],
    quizzes: [
      {
        id: 'quiz_' + crypto.randomUUID().slice(0, 8),
        title: `${subject || 'Lecture'} Comprehension Check`,
        subject: subject || 'General',
        question: `What is the core concept covered in today's ${name} lecture?`,
        options: [
          { id: 'A', text: 'Theoretical overview and fundamental principles', isCorrect: true },
          { id: 'B', text: 'Unrelated external libraries' },
          { id: 'C', text: 'Legacy system depreciation' },
          { id: 'D', text: 'Hardware network wiring' },
        ],
        explanation: 'The lecture focuses on foundational core concepts and real-time interaction.',
        timer_seconds: 30,
        is_active: false,
        responses: [],
      },
    ],
    resources: [],
    screenshare: {
      is_sharing: false,
      shared_by: null,
      role: null,
    },
  }

  db.classrooms.unshift(classroom)
  writeDB(db)
  return classroom
}

export function getClassroomByCode(code) {
  const cleanCode = normalizeCode(code)
  if (!cleanCode) return null
  const db = readDB()
  return db.classrooms.find((c) => c.code.toUpperCase() === cleanCode) || null
}

export function getAllClassrooms() {
  const db = readDB()
  return db.classrooms || []
}

export function getClassroomsForTeacher(teacherId) {
  const db = readDB()
  return db.classrooms.filter((c) => c.teacher_id === teacherId)
}

// A student "belongs" to a classroom if they are in it right now OR attended before
// (member_ids survives a voluntary leave so past lectures stay in their history).
export function isStudentMember(classroom, studentId) {
  if (!classroom || !studentId) return false
  return (
    (classroom.students || []).some((s) => s.id === studentId) ||
    (classroom.member_ids || []).includes(studentId)
  )
}

export function isStudentInRoom(classroom, studentId) {
  return Boolean(classroom && (classroom.students || []).some((s) => s.id === studentId))
}

export function getClassroomsForStudent(studentId) {
  const db = readDB()
  return db.classrooms.filter((c) => isStudentMember(c, studentId))
}

// Only these fields may be changed through the update endpoint.
const UPDATABLE_FIELDS = ['name', 'subject', 'description', 'scheduled_date', 'is_active', 'ended_at']

export function updateClassroom(code, updates) {
  const cleanCode = normalizeCode(code)
  const db = readDB()
  const idx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (idx === -1) return null

  const safe = {}
  for (const key of UPDATABLE_FIELDS) {
    if (updates && Object.prototype.hasOwnProperty.call(updates, key)) safe[key] = updates[key]
  }
  if (typeof safe.name === 'string') safe.name = safe.name.trim().slice(0, 120) || db.classrooms[idx].name
  if (typeof safe.subject === 'string') safe.subject = safe.subject.trim().slice(0, 120) || db.classrooms[idx].subject
  if (typeof safe.description === 'string') safe.description = safe.description.trim().slice(0, 1000)
  if (safe.is_active === true) safe.ended_at = null

  db.classrooms[idx] = { ...db.classrooms[idx], ...safe }
  writeDB(db)
  return db.classrooms[idx]
}

export function deleteClassroom(code) {
  const cleanCode = normalizeCode(code)
  const db = readDB()
  const initialLen = db.classrooms.length
  db.classrooms = db.classrooms.filter((c) => c.code.toUpperCase() !== cleanCode)
  const deleted = db.classrooms.length < initialLen
  if (deleted) writeDB(db)
  return deleted
}

// ================= PARTICIPANTS (REAL STUDENTS ONLY) =================
export function addStudentToClassroom(code, studentUser) {
  const cleanCode = normalizeCode(code)
  const db = readDB()
  const classroom = db.classrooms.find((c) => c.code.toUpperCase() === cleanCode)
  if (!classroom) return null

  classroom.students = classroom.students || []
  classroom.member_ids = classroom.member_ids || []

  const studentName = studentUser.name || studentUser.full_name || 'Student'
  const existingIdx = classroom.students.findIndex(
    (s) => s.id === studentUser.id || (studentUser.email && s.email === studentUser.email)
  )

  const studentObj = {
    id: studentUser.id,
    name: studentName,
    full_name: studentName,
    email: studentUser.email,
    role: 'student',
    joined_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'active',
    is_camera_on: true,
    is_mic_on: false,
    is_screen_sharing: false,
  }

  if (existingIdx !== -1) {
    // Re-joining: keep original join time and media state
    const prev = classroom.students[existingIdx]
    classroom.students[existingIdx] = {
      ...prev,
      name: studentName,
      full_name: studentName,
      status: 'active',
    }
  } else {
    classroom.students.push(studentObj)
  }

  if (!classroom.member_ids.includes(studentUser.id)) classroom.member_ids.push(studentUser.id)

  writeDB(db)
  return classroom
}

// kicked=true  -> teacher removed the student: they also lose access to the class history
// kicked=false -> student left on their own: the class stays in their history
export function removeStudentFromClassroom(code, studentId, { kicked = false } = {}) {
  const cleanCode = normalizeCode(code)
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const classroom = db.classrooms[cIdx]
  classroom.students = (classroom.students || []).filter((s) => s.id !== studentId)
  if (kicked) {
    classroom.member_ids = (classroom.member_ids || []).filter((id) => id !== studentId)
  }
  writeDB(db)
  return classroom
}

export function updateParticipantMediaState(code, userId, { is_camera_on, is_mic_on, is_screen_sharing }) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const classroom = db.classrooms[cIdx]
  const student = (classroom.students || []).find((s) => s.id === userId)
  if (student) {
    if (is_camera_on !== undefined) student.is_camera_on = is_camera_on
    if (is_mic_on !== undefined) student.is_mic_on = is_mic_on
    if (is_screen_sharing !== undefined) student.is_screen_sharing = is_screen_sharing
    writeDB(db)
  }
  return classroom
}

// ================= TRANSCRIPTS =================
export function addTranscriptItem(code, item) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const transcript = {
    id: 't_' + crypto.randomUUID().slice(0, 8),
    speaker: item.speaker || 'Teacher',
    text: item.text.trim(),
    timestamp: item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: new Date().toISOString(),
  }

  db.classrooms[cIdx].transcripts = db.classrooms[cIdx].transcripts || []
  db.classrooms[cIdx].transcripts.push(transcript)
  writeDB(db)
  return transcript
}

export function clearTranscripts(code) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return false
  db.classrooms[cIdx].transcripts = []
  writeDB(db)
  return true
}

// ================= GESTURES =================
export function addGestureEvent(code, gesture) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const event = {
    id: 'g_' + crypto.randomUUID().slice(0, 8),
    student_id: gesture.student_id,
    student_name: gesture.student_name || 'Student',
    gesture_name: gesture.gesture_name,
    gesture_label: gesture.gesture_label,
    emoji: gesture.emoji || '✋',
    meaning: gesture.meaning || '',
    confidence: gesture.confidence || 0.95,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: new Date().toISOString(),
  }

  db.classrooms[cIdx].gestures = db.classrooms[cIdx].gestures || []
  db.classrooms[cIdx].gestures.unshift(event)
  if (db.classrooms[cIdx].gestures.length > 50) {
    db.classrooms[cIdx].gestures = db.classrooms[cIdx].gestures.slice(0, 50)
  }
  writeDB(db)
  return event
}

// ================= TYPED QUESTIONS =================
export function addStudentQuestion(code, { student_id, student_name, text }) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const question = {
    id: 'q_' + crypto.randomUUID().slice(0, 8),
    student_id,
    student_name: student_name || 'Student',
    text: text.trim(),
    answered: false,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: new Date().toISOString(),
  }

  db.classrooms[cIdx].questions = db.classrooms[cIdx].questions || []
  db.classrooms[cIdx].questions.unshift(question)

  // Also append to transcripts feed
  db.classrooms[cIdx].transcripts = db.classrooms[cIdx].transcripts || []
  db.classrooms[cIdx].transcripts.push({
    id: 't_q_' + question.id,
    speaker: `${student_name} (Question)`,
    text: `❓ ${text.trim()}`,
    timestamp: question.timestamp,
    created_at: question.created_at,
  })

  writeDB(db)
  return question
}

// ================= POLLS =================
export function createPoll(code, { question, options }) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const newPoll = {
    id: 'poll_' + crypto.randomUUID().slice(0, 8),
    question: question.trim(),
    options: options.map((opt, i) => ({
      id: 'opt_' + i,
      text: typeof opt === 'string' ? opt : opt.text,
      votes: 0,
      voters: [],
    })),
    total_votes: 0,
    is_active: true,
    created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }

  db.classrooms[cIdx].polls = db.classrooms[cIdx].polls || []
  // close existing polls
  db.classrooms[cIdx].polls.forEach((p) => (p.is_active = false))
  db.classrooms[cIdx].polls.unshift(newPoll)
  writeDB(db)
  return newPoll
}

export function votePoll(code, pollId, optionId, studentId) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const classroom = db.classrooms[cIdx]
  const poll = (classroom.polls || []).find((p) => p.id === pollId)
  if (!poll || !poll.is_active) return null

  // Check if student already voted
  const alreadyVoted = poll.options.some((o) => o.voters && o.voters.includes(studentId))
  if (alreadyVoted) return poll

  const opt = poll.options.find((o) => o.id === optionId)
  if (opt) {
    opt.votes = (opt.votes || 0) + 1
    opt.voters = opt.voters || []
    opt.voters.push(studentId)
    poll.total_votes = (poll.total_votes || 0) + 1
    writeDB(db)
  }
  return poll
}

export function closePoll(code, pollId) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const classroom = db.classrooms[cIdx]
  const poll = (classroom.polls || []).find((p) => (pollId ? p.id === pollId : p.is_active))
  if (poll) {
    poll.is_active = false
    writeDB(db)
  }
  return poll
}

// ================= QUIZZES =================
export function createQuiz(code, quizData) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const newQuiz = {
    id: 'quiz_' + crypto.randomUUID().slice(0, 8),
    title: quizData.title?.trim() || 'Subject Quiz',
    subject: quizData.subject?.trim() || 'General',
    question: String(quizData.question || '').trim(),
    options: Array.isArray(quizData.options) ? quizData.options : [],
    explanation: quizData.explanation?.trim() || '',
    timer_seconds: quizData.timer_seconds || 30,
    is_active: true,
    responses: [],
    created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }

  db.classrooms[cIdx].quizzes = db.classrooms[cIdx].quizzes || []
  db.classrooms[cIdx].quizzes.forEach((q) => (q.is_active = false))
  db.classrooms[cIdx].quizzes.unshift(newQuiz)
  writeDB(db)
  return newQuiz
}

export function launchQuiz(code, quizId) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  let target = null
  db.classrooms[cIdx].quizzes = db.classrooms[cIdx].quizzes || []
  db.classrooms[cIdx].quizzes.forEach((q) => {
    if (q.id === quizId) {
      q.is_active = true
      target = q
    } else {
      q.is_active = false
    }
  })
  writeDB(db)
  return target
}

export function submitQuizAnswer(code, quizId, { student_id, student_name, selected_option }) {
  const cleanCode = normalizeCode(code)
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const quiz = (db.classrooms[cIdx].quizzes || []).find((q) => q.id === quizId)
  if (!quiz || !quiz.is_active) return null

  const option = (quiz.options || []).find((o) => o.id === selected_option)
  if (!option) return null

  quiz.responses = quiz.responses || []
  const existingIdx = quiz.responses.findIndex((r) => r.student_id === student_id)
  const respObj = {
    student_id,
    student_name,
    selected_option,
    // Correctness is decided here on the server, never trusted from the browser
    is_correct: Boolean(option.isCorrect),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
  if (existingIdx !== -1) {
    quiz.responses[existingIdx] = respObj
  } else {
    quiz.responses.push(respObj)
  }
  writeDB(db)
  return quiz
}

export function closeQuiz(code, quizId) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  db.classrooms[cIdx].quizzes = db.classrooms[cIdx].quizzes || []
  db.classrooms[cIdx].quizzes.forEach((q) => {
    if (!quizId || q.id === quizId) {
      q.is_active = false
    }
  })
  writeDB(db)
  return true
}

// ================= RESOURCES (PDFs) =================
export function addResource(code, resource) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  const newRes = {
    id: 'res_' + crypto.randomUUID().slice(0, 8),
    title: resource.title?.trim() || 'Classroom Document',
    fileName: resource.fileName || 'Resource.pdf',
    fileType: resource.fileType || 'pdf',
    fileSize: resource.fileSize || '1.5 MB',
    description: resource.description?.trim() || '',
    url: resource.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    uploaded_by: resource.uploaded_by || 'Instructor',
    uploaded_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }

  db.classrooms[cIdx].resources = db.classrooms[cIdx].resources || []
  db.classrooms[cIdx].resources.unshift(newRes)
  writeDB(db)
  return newRes
}

export function deleteResource(code, resourceId) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return false

  db.classrooms[cIdx].resources = (db.classrooms[cIdx].resources || []).filter(
    (r) => r.id !== resourceId
  )
  writeDB(db)
  return true
}

// ================= SCREEN SHARING =================
export function setScreenShare(code, { is_sharing, shared_by, role }) {
  const cleanCode = code.toUpperCase().trim()
  const db = readDB()
  const cIdx = db.classrooms.findIndex((c) => c.code.toUpperCase() === cleanCode)
  if (cIdx === -1) return null

  db.classrooms[cIdx].screenshare = {
    is_sharing: Boolean(is_sharing),
    shared_by: shared_by || null,
    role: role || null,
    started_at: is_sharing ? new Date().toISOString() : null,
  }
  writeDB(db)
  return db.classrooms[cIdx].screenshare
}
