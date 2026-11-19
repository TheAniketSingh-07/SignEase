import { eventBus } from '@/lib/server/events'
import { authorize, getSessionUser, jsonError } from '@/lib/server/auth'
import { normalizeCode } from '@/lib/server/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Server-Sent Events stream.
 *   /api/realtime?code=ABC1234  -> live events for ONE classroom (captions, polls, gestures...)
 *   /api/realtime               -> lightweight "refresh your list" signals for dashboards
 * Both require a signed-in user.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rawCode = searchParams.get('code')
  const code = rawCode ? normalizeCode(rawCode) : null

  if (rawCode) {
    // Room stream: must be the owning teacher or a student (who joins right after connecting)
    const ctx = authorize(request, code, 'viewer')
    if (ctx.error) return ctx.error
  } else if (!getSessionUser(request)) {
    return jsonError('Please sign in to continue.', 401)
  }

  const encoder = new TextEncoder()
  let cleanup = () => {}

  const customStream = new ReadableStream({
    start(controller) {
      const send = (eventName, data) => {
        try {
          controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch (e) {
          // stream already closed
        }
      }

      send('connected', { status: 'connected', room: code || 'global', time: Date.now() })

      const roomListener = (eventData) => send('message', eventData)
      const globalListener = (eventData) => send('global', eventData)

      // A room connection ONLY hears its own room. Dashboards (no code) hear the global signals.
      if (code) {
        eventBus.on(`room:${code}`, roomListener)
      } else {
        eventBus.on('global', globalListener)
      }

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch (e) {
          cleanup()
        }
      }, 15000)

      let closed = false
      cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(keepAlive)
        if (code) eventBus.off(`room:${code}`, roomListener)
        else eventBus.off('global', globalListener)
        try {
          controller.close()
        } catch (e) {}
      }

      request.signal.addEventListener('abort', cleanup)
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
