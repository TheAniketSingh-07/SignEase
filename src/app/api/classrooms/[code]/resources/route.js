import { NextResponse } from 'next/server'
import { addResource, deleteResource } from '@/lib/server/db'
import { broadcastToRoom } from '@/lib/server/events'
import { authorize, getRouteCode, jsonError } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const code = await getRouteCode(params)
  const ctx = authorize(req, code, 'member')
  if (ctx.error) return ctx.error
  return NextResponse.json({ resources: ctx.classroom.resources || [] })
}

export async function POST(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const resource = await req.json()
    const item = addResource(code, { ...resource, uploaded_by: ctx.user.name })
    if (!item) return jsonError('Failed to add resource', 400)

    broadcastToRoom(code, { type: 'NEW_RESOURCE', resource: item })
    return NextResponse.json({ success: true, resource: item })
  } catch (err) {
    return jsonError('Failed to upload resource', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const code = await getRouteCode(params)
    const ctx = authorize(req, code, 'teacher')
    if (ctx.error) return ctx.error

    const { resourceId } = await req.json()

    const deleted = deleteResource(code, resourceId)
    if (!deleted) return jsonError('Resource not found', 404)

    broadcastToRoom(code, { type: 'RESOURCE_DELETED', resourceId })
    broadcastToRoom(code, { type: 'RESOURCES_UPDATED' })
    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError('Failed to delete resource', 500)
  }
}
