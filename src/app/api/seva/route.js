import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SEVA_KNOWLEDGE_BASE = [
  {
    keywords: ['create', 'start', 'classroom', 'new class', 'how to create'],
    answer:
      "To start a classroom as an instructor:\n1. Click 'Start Classroom' on the homepage.\n2. Log in or register as a Teacher.\n3. Enter your Class Name, Subject, and Date.\n4. Click 'Create Classroom'. You will receive a unique 7-character room code (e.g., NXJS428) to share with your students!",
  },
  {
    keywords: ['join', 'code', 'student', 'how to join', 'enter room'],
    answer:
      "To join a classroom as a student:\n1. Click 'Join Classroom' on the homepage.\n2. Enter the 7-character code provided by your instructor (e.g. NXJS428).\n3. Log in or create a Student account.\n4. You will immediately enter the live classroom with live speech captions, sign language gesture detection, and resources!",
  },
  {
    keywords: ['caption', 'speech', 'transcript', 'mic', 'microphone', 'voice'],
    answer:
      "SignEase uses real-time speech recognition to convert educator voice into live captions on student screens:\n- Click 'Start Captions (Mic)' on the teacher screen.\n- The microphone level indicator will show active voice input.\n- Interim words stream live to all students across devices with sub-second latency.\n- You can also type captions directly into the quick caption bar if speaking in a noisy room!",
  },
  {
    keywords: ['gesture', 'sign', 'hand', 'mediapipe', 'sign language', 'signs'],
    answer:
      "SignEase recognizes 8 classroom sign language gestures using 21-point MediaPipe hand tracking:\n1. ❓ Upright Index Finger: Ask a Question\n2. ✋ Open Palm: Raise Hand to Speak\n3. 👍 Thumbs Up: Understood / Clear\n4. 👎 Thumbs Down: Need Help\n5. ✌️ Peace Sign: Yes / Agree\n6. ✊ Closed Fist: No / Disagree\n7. ⏳ Pinch: Please Slow Down\n8. 🤟 ILY Sign: Great Lecture / Appreciation\nHold any sign for 0.6s to send an instant alert to the instructor!",
  },
  {
    keywords: ['camera', 'video', 'hide face', 'turn off camera', 'mute', 'audio'],
    answer:
      "Both teachers and students have full control over their audio and video:\n- Toggle 'Camera On/Off' to show your video or hide your face.\n- When camera is turned off, your initials avatar is shown cleanly.\n- Toggle 'Mic On/Off' to mute or unmute audio at any time.",
  },
  {
    keywords: ['screen', 'share', 'screenshare', 'presentation'],
    answer:
      "Screen sharing is supported for both teachers and students:\n- Click the 'Share Screen' button in the live classroom.\n- Select your entire screen, window, or browser tab.\n- The live stream updates across all connected devices in real time so students can follow slides or code demos!",
  },
  {
    keywords: ['question', 'type question', 'ask question', 'doubt'],
    answer:
      "Students can ask questions in two easy ways:\n1. Show the ❓ upright index gesture to your camera.\n2. Or click 'Ask Question' in the student portal, type your question, and hit Send! The instructor receives an immediate alert on screen.",
  },
  {
    keywords: ['poll', 'vote', 'opinion', 'comprehension'],
    answer:
      "Live Polls allow educators to gauge comprehension in real time:\n- Teacher clicks 'Polls' -> selects a template or writes custom question -> launches to class.\n- Students receive the live question, vote with 1 click, and watch live percentage bars update instantly!",
  },
  {
    keywords: ['quiz', 'test', 'exam', 'quizzes'],
    answer:
      "SignEase features an interactive quiz arena:\n- Teacher can browse multiple pre-built subject quizzes or create custom questions with options, timers, and explanations.\n- Students answer against the live countdown timer and receive instant scores and explanations!",
  },
  {
    keywords: ['pdf', 'resource', 'material', 'upload', 'download'],
    answer:
      "Instructors can share study materials like in Zoom:\n- Click 'Share PDF' in the live classroom -> upload slides or reference documents.\n- All students receive an instant notification and can preview or download the file directly.",
  },
  {
    keywords: ['delete', 'remove', 'history', 'admin', 'delete class'],
    answer:
      "Instructors can delete any previous classroom:\n- Go to Teacher Dashboard or History.\n- Click the red 'Delete' trash icon on any classroom card and confirm.\n- The classroom is permanently deleted from the database and vanishes from both the teacher and student portals in real time!",
  },
]

export async function POST(req) {
  try {
    const { message } = await req.json()
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const lower = message.toLowerCase().trim()

    // 1. Try Gemini API if key exists
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
    if (apiKey && process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are SEVA (SignEase Virtual Agent), the friendly, knowledgeable AI assistant for SignEase — a real-time classroom accessibility platform for deaf and hard-of-hearing students.
Help the user with their question. Be concise, warm, helpful, and provide clear step-by-step guidance.
User question: "${message}"`,
                    },
                  ],
                },
              ],
            }),
          }
        )
        const geminiData = await response.json()
        const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (textContent) {
          return NextResponse.json({ reply: textContent })
        }
      } catch (e) {
        console.warn('Gemini SEVA fallback:', e)
      }
    }

    // 2. Intelligent NLP Keyword Matching
    let bestMatch = null
    let highestScore = 0

    for (const entry of SEVA_KNOWLEDGE_BASE) {
      let score = 0
      for (const kw of entry.keywords) {
        if (lower.includes(kw)) {
          score += kw.length
        }
      }
      if (score > highestScore) {
        highestScore = score
        bestMatch = entry
      }
    }

    if (bestMatch && highestScore > 0) {
      return NextResponse.json({ reply: bestMatch.answer })
    }

    // Default friendly response
    const defaultResponse =
      "Hello! I'm SEVA (SignEase Virtual Agent), your classroom assistant. I can guide you on:\n\n• Starting or joining a classroom with room codes\n• Setting up real-time speech captions and microphone\n• Using MediaPipe 21-point hand gesture recognition\n• Toggling audio, camera, and screen sharing\n• Launching live polls, custom quizzes, and sharing PDFs\n• Deleting old classes from history\n\nHow can I help you today?"

    return NextResponse.json({ reply: defaultResponse })
  } catch (err) {
    return NextResponse.json(
      { reply: "Hello! I am SEVA. I'm here to assist you with classroom codes, speech captions, sign language gestures, and interactive quizzes. How can I assist you?" },
      { status: 200 }
    )
  }
}
