import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getBaseUrl, isSecureRequest, GOOGLE_STATE_COOKIE } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Only allow redirects back into this app (prevents open-redirect abuse). */
function safeInternalPath(p) {
  if (!p || typeof p !== 'string') return ''
  if (!p.startsWith('/') || p.startsWith('//') || p.includes('\\')) return ''
  return p
}

/**
 * STEP 1 of Google sign-in: send the browser to Google's real consent / account chooser.
 * GET /api/auth/google?role=teacher|student&redirect=/some/path
 */
export async function GET(req) {
  const base = getBaseUrl(req)
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') === 'teacher' ? 'teacher' : 'student'
  const redirect = safeInternalPath(searchParams.get('redirect'))

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    const url = new URL('/login', base)
    url.searchParams.set('role', role)
    url.searchParams.set(
      'error',
      'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local (see README).'
    )
    return NextResponse.redirect(url)
  }

  // CSRF protection (state) + PKCE
  const state = b64url(crypto.randomBytes(24))
  const codeVerifier = b64url(crypto.randomBytes(48))
  const codeChallenge = b64url(crypto.createHash('sha256').update(codeVerifier).digest())

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', `${base}/api/auth/google/callback`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  // Always show Google's account chooser instead of silently reusing one account
  authUrl.searchParams.set('prompt', 'select_account')

  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set(
    GOOGLE_STATE_COOKIE,
    JSON.stringify({ state, codeVerifier, role, redirect }),
    {
      path: '/api/auth/google',
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureRequest(req),
      maxAge: 60 * 10, // 10 minutes to finish signing in
    }
  )
  return response
}
