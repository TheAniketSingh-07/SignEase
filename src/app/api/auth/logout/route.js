import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/server/db'
import { getTokenFromRequest, SESSION_COOKIE } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req)
    if (token) deleteSession(token)
  } catch (err) {
    // logging out must never fail
  }
  const response = NextResponse.json({ success: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
