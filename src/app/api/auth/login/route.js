import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/server/db'
import { setSessionCookie } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const { user, token } = authenticateUser(email, password)

    const response = NextResponse.json({ success: true, user })
    setSessionCookie(response, token, req)
    return response
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Invalid credentials.' }, { status: 401 })
  }
}
