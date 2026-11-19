import { NextResponse } from 'next/server'
import { updateParticipantMediaState, setScreenShare } from '@/lib/server/db'
import { broadcastToRoom } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'room')
    if (ctx.error) return ctx.error

    const body = await req.json()
    const { is_camera_on, is_mic_on, is_screen_sharing, action } = body
    const role = ctx.user.role

    if (action === 'screenshare') {
      const screenshare = setScreenShare(code, {
        is_sharing: is_screen_sharing,
        shared_by: ctx.user.name,
        role,
      })
      broadcastToRoom(code, { type: 'SCREENSHARE_UPDATED', screenshare })
      return NextResponse.json({ success: true, screenshare })
    }

    // Media toggle (mic / camera) for the caller only
    updateParticipantMediaState(code, ctx.user.id, { is_camera_on, is_mic_on, is_screen_sharing })
    broadcastToRoom(code, {
      type: 'MEDIA_STATE_CHANGED',
      userId: ctx.user.id,
      role,
      is_camera_on,
      is_mic_on,
      is_screen_sharing,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError('Failed to update media status', 500)
  }
}
