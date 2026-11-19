import { NextResponse } from 'next/server'
import { createUser } from '@/lib/server/db'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { name, fullName, email, password, role } = await req.json()

    const userFullName = name || fullName
    if (!userFullName || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide full name, email, and password.' },
        { status: 400 }
      )
    }

    const user = createUser({
      name: userFullName,
      email,
      password,
      role: role === 'teacher' ? 'teacher' : 'student',
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Registration failed.' }, { status: 400 })
  }
}
