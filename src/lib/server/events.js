import { EventEmitter } from 'events'

// Global singleton EventBus shared by every Next.js API route in the same Node process
if (!globalThis.__signease_event_bus) {
  const bus = new EventEmitter()
  bus.setMaxListeners(1000)
  globalThis.__signease_event_bus = bus
}

export const eventBus = globalThis.__signease_event_bus

/**
 * Send an event ONLY to the people inside one classroom.
 * (Previously this also leaked every event to a global channel, so captions, polls
 * and removals from one classroom showed up in every other classroom.)
 */
export function broadcastToRoom(code, event) {
  if (!code) return
  const cleanCode = code.toUpperCase().trim()
  eventBus.emit(`room:${cleanCode}`, { code: cleanCode, ...event })
}

/**
 * Lightweight "something changed, please refresh your list" signal for dashboards.
 * Carries only the event type and the classroom code - never classroom contents.
 */
export function broadcastGlobal(event) {
  const { type, code } = event || {}
  if (!type) return
  eventBus.emit('global', { type, code: code ? String(code).toUpperCase() : undefined })
}
