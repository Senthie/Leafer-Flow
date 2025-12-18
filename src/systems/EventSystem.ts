// EventSystem - centralized event management and distribution

import {
  FlowEvent,
  NodeEvent,
  EdgeEvent,
  InteractionEvent,
  ViewportEvent,
} from '../events/types'

export type EventCallback<T extends FlowEvent = FlowEvent> = (event: T) => void
export type EventType = string

export interface EventSystemOptions {
  maxListeners?: number
  enableLogging?: boolean
}

export class EventSystem {
  private listeners: Map<EventType, Set<EventCallback>> = new Map()
  private onceListeners: Map<EventType, Set<EventCallback>> = new Map()
  private maxListeners: number
  private enableLogging: boolean
  private eventHistory: FlowEvent[] = []
  private maxHistorySize: number = 1000

  constructor(options: EventSystemOptions = {}) {
    this.maxListeners = options.maxListeners || 100
    this.enableLogging = options.enableLogging || false
  }

  // Event listener registration
  public on<T extends FlowEvent = FlowEvent>(
    eventType: EventType,
    callback: EventCallback<T>
  ): void {
    this.validateEventType(eventType)
    this.validateCallback(callback)

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    const eventListeners = this.listeners.get(eventType)!

    // Check max listeners limit
    if (eventListeners.size >= this.maxListeners) {
      console.warn(
        `Maximum number of listeners (${this.maxListeners}) reached for event type: ${eventType}`
      )
    }

    eventListeners.add(callback as EventCallback)

    if (this.enableLogging) {
      console.log(`Event listener registered for: ${eventType}`)
    }
  }

  // One-time event listener registration
  public once<T extends FlowEvent = FlowEvent>(
    eventType: EventType,
    callback: EventCallback<T>
  ): void {
    this.validateEventType(eventType)
    this.validateCallback(callback)

    if (!this.onceListeners.has(eventType)) {
      this.onceListeners.set(eventType, new Set())
    }

    const onceEventListeners = this.onceListeners.get(eventType)!
    onceEventListeners.add(callback as EventCallback)

    if (this.enableLogging) {
      console.log(`One-time event listener registered for: ${eventType}`)
    }
  }

  // Event listener removal
  public off<T extends FlowEvent = FlowEvent>(
    eventType: EventType,
    callback: EventCallback<T>
  ): boolean {
    this.validateEventType(eventType)
    this.validateCallback(callback)

    let removed = false

    // Remove from regular listeners
    const eventListeners = this.listeners.get(eventType)
    if (eventListeners) {
      removed = eventListeners.delete(callback as EventCallback)

      // Clean up empty sets
      if (eventListeners.size === 0) {
        this.listeners.delete(eventType)
      }
    }

    // Remove from once listeners
    const onceEventListeners = this.onceListeners.get(eventType)
    if (onceEventListeners) {
      const onceRemoved = onceEventListeners.delete(callback as EventCallback)
      removed = removed || onceRemoved

      // Clean up empty sets
      if (onceEventListeners.size === 0) {
        this.onceListeners.delete(eventType)
      }
    }

    if (this.enableLogging && removed) {
      console.log(`Event listener removed for: ${eventType}`)
    }

    return removed
  }

  // Remove all listeners for a specific event type
  public removeAllListeners(eventType?: EventType): void {
    if (eventType) {
      this.validateEventType(eventType)
      this.listeners.delete(eventType)
      this.onceListeners.delete(eventType)

      if (this.enableLogging) {
        console.log(`All listeners removed for: ${eventType}`)
      }
    } else {
      // Remove all listeners for all event types
      this.listeners.clear()
      this.onceListeners.clear()

      if (this.enableLogging) {
        console.log('All event listeners removed')
      }
    }
  }

  // Event emission
  public emit<T extends FlowEvent = FlowEvent>(
    eventType: EventType,
    event: T
  ): boolean {
    this.validateEventType(eventType)
    this.validateEvent(event)

    // Ensure event has correct type and timestamp
    const completeEvent: T = {
      ...event,
      type: eventType,
      timestamp: event.timestamp || Date.now(),
    }

    // Add to event history
    this.addToHistory(completeEvent)

    let hasListeners = false

    // Emit to regular listeners
    const eventListeners = this.listeners.get(eventType)
    if (eventListeners && eventListeners.size > 0) {
      hasListeners = true

      // Create a copy of listeners to avoid issues if listeners are modified during emission
      const listenersCopy = Array.from(eventListeners)

      for (const callback of listenersCopy) {
        try {
          callback(completeEvent)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
          // Continue with other listeners even if one fails
        }
      }
    }

    // Emit to once listeners and remove them
    const onceEventListeners = this.onceListeners.get(eventType)
    if (onceEventListeners && onceEventListeners.size > 0) {
      hasListeners = true

      // Create a copy of listeners and clear the original set
      const onceListenersCopy = Array.from(onceEventListeners)
      onceEventListeners.clear()

      // Clean up empty set
      if (onceEventListeners.size === 0) {
        this.onceListeners.delete(eventType)
      }

      for (const callback of onceListenersCopy) {
        try {
          callback(completeEvent)
        } catch (error) {
          console.error(`Error in once event listener for ${eventType}:`, error)
          // Continue with other listeners even if one fails
        }
      }
    }

    if (this.enableLogging) {
      console.log(`Event emitted: ${eventType}`, completeEvent.data)
    }

    return hasListeners
  }

  // Convenience methods for specific event types
  public emitNodeEvent(event: NodeEvent): boolean {
    return this.emit(event.type, event)
  }

  public emitEdgeEvent(event: EdgeEvent): boolean {
    return this.emit(event.type, event)
  }

  public emitInteractionEvent(event: InteractionEvent): boolean {
    return this.emit(event.type, event)
  }

  public emitViewportEvent(event: ViewportEvent): boolean {
    return this.emit(event.type, event)
  }

  // Event listener information
  public getListenerCount(eventType?: EventType): number {
    if (eventType) {
      this.validateEventType(eventType)
      const regularCount = this.listeners.get(eventType)?.size || 0
      const onceCount = this.onceListeners.get(eventType)?.size || 0
      return regularCount + onceCount
    } else {
      // Return total listener count across all event types
      let totalCount = 0

      for (const listeners of this.listeners.values()) {
        totalCount += listeners.size
      }

      for (const onceListeners of this.onceListeners.values()) {
        totalCount += onceListeners.size
      }

      return totalCount
    }
  }

  public getEventTypes(): EventType[] {
    const eventTypes = new Set<EventType>()

    for (const eventType of this.listeners.keys()) {
      eventTypes.add(eventType)
    }

    for (const eventType of this.onceListeners.keys()) {
      eventTypes.add(eventType)
    }

    return Array.from(eventTypes)
  }

  public hasListeners(eventType: EventType): boolean {
    this.validateEventType(eventType)
    return (
      (this.listeners.get(eventType)?.size || 0) > 0 ||
      (this.onceListeners.get(eventType)?.size || 0) > 0
    )
  }

  // Event history management
  public getEventHistory(eventType?: EventType, limit?: number): FlowEvent[] {
    let history = this.eventHistory

    // Filter by event type if specified
    if (eventType) {
      this.validateEventType(eventType)
      history = history.filter(event => event.type === eventType)
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      history = history.slice(-limit)
    }

    return [...history] // Return a copy to prevent external modification
  }

  public clearEventHistory(): void {
    this.eventHistory = []

    if (this.enableLogging) {
      console.log('Event history cleared')
    }
  }

  public setMaxHistorySize(size: number): void {
    if (size < 0) {
      throw new Error('Max history size must be non-negative')
    }

    this.maxHistorySize = size

    // Trim current history if needed
    if (this.eventHistory.length > size) {
      this.eventHistory = this.eventHistory.slice(-size)
    }
  }

  // Utility methods
  public getStats(): {
    totalListeners: number
    eventTypes: number
    historySize: number
    maxHistorySize: number
  } {
    return {
      totalListeners: this.getListenerCount(),
      eventTypes: this.getEventTypes().length,
      historySize: this.eventHistory.length,
      maxHistorySize: this.maxHistorySize,
    }
  }

  // Cleanup method
  public destroy(): void {
    this.removeAllListeners()
    this.clearEventHistory()

    if (this.enableLogging) {
      console.log('EventSystem destroyed')
    }
  }

  // Private validation methods
  private validateEventType(eventType: EventType): void {
    if (!eventType || typeof eventType !== 'string') {
      throw new Error('Event type must be a non-empty string')
    }
  }

  private validateCallback(callback: any): void {
    if (!callback || typeof callback !== 'function') {
      throw new Error('Event callback must be a function')
    }
  }

  private validateEvent(event: FlowEvent): void {
    if (!event || typeof event !== 'object') {
      throw new Error('Event must be an object')
    }

    if (event.data === undefined) {
      throw new Error('Event must have a data property')
    }
  }

  private addToHistory(event: FlowEvent): void {
    this.eventHistory.push(event)

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
    }
  }
}
