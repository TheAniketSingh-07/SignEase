import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    return NextResponse.json({ user: getSessionUser(req) || null }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
