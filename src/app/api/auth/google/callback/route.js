import { NextResponse } from 'next/server'
import { findOrCreateGoogleUser } from '@/lib/server/db'
import { getBaseUrl, setSessionCookie, GOOGLE_STATE_COOKIE } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

function fail(base, role, message) {
  const url = new URL('/login', base)
  url.searchParams.set('role', role || 'student')
  url.searchParams.set('error', message)
  const res = NextResponse.redirect(url)
  res.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: '/api/auth/google' })
  return res
}

/**
 * STEP 2 of Google sign-in: Google sends the user back here with ?code=...
 * We verify state, swap the code for tokens (server-to-server, using the client secret),
 * read the verified Google profile, create/find the SignEase user and start a session.
 */
export async function GET(req) {
  const base = getBaseUrl(req)
  const { searchParams } = new URL(req.url)

  let saved = {}
  try {
    saved = JSON.parse(req.cookies.get(GOOGLE_STATE_COOKIE)?.value || '{}')
  } catch {
    saved = {}
  }
  const role = saved.role === 'teacher' ? 'teacher' : 'student'

  // The user pressed "Cancel" on Google's screen (or Google reported an error)
  const googleError = searchParams.get('error')
  if (googleError) {
    return fail(
      base,
      role,
      googleError === 'access_denied'
        ? 'Google sign-in was cancelled.'
        : `Google sign-in failed (${googleError}).`
    )
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  if (!code || !state || !saved.state || state !== saved.state) {
    return fail(base, role, 'Google sign-in session expired or was invalid. Please try again.')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return fail(base, role, 'Google sign-in is not configured on the server.')
  }

  try {
    // 1. Exchange the authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${base}/api/auth/google/callback`,
        grant_type: 'authorization_code',
        code_verifier: saved.codeVerifier || '',
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokenRes.ok || !tokens.access_token) {
      console.error('Google token exchange failed:', tokens)
      const hint =
        tokens.error === 'redirect_uri_mismatch'
          ? 'Redirect URI mismatch - add ' + `${base}/api/auth/google/callback` + ' to your Google Cloud OAuth client.'
          : tokens.error === 'invalid_client'
            ? 'Invalid Google client ID / secret in .env.local.'
            : 'Could not complete Google sign-in. Please try again.'
      return fail(base, role, hint)
    }

    // 2. Read the verified profile from Google
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json()
    if (!profileRes.ok || !profile.sub || !profile.email) {
      return fail(base, role, 'Google did not return your profile. Please try again.')
    }
    if (profile.email_verified === false) {
      return fail(base, role, 'Your Google email address is not verified.')
    }

    // 3. Create or find the SignEase user, then start our own session
    const { user, token } = findOrCreateGoogleUser({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || profile.given_name,
      picture: profile.picture,
      role,
    })

    // Where to go next. If the account's real role differs from the one picked on the
    // login screen, ignore the saved redirect (it was meant for the other role).
    let next = saved.redirect || ''
    if (user.role !== role) next = ''
    if (!next) next = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'

    const dest = new URL('/auth/callback', base)
    dest.searchParams.set('next', next)
    const response = NextResponse.redirect(dest)
    setSessionCookie(response, token, req)
    response.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: '/api/auth/google' })
    return response
  } catch (err) {
    console.error('Google OAuth error:', err)
    return fail(base, role, 'Google sign-in failed. Please try again.')
  }
}
