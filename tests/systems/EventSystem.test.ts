// EventSystem tests

import { EventSystem } from '../../src/systems/EventSystem'
import {
  FlowEvent,
  NodeEvent,
  EdgeEvent,
  InteractionEvent,
  ViewportEvent,
} from '../../src/events/types'

describe('EventSystem', () => {
  let eventSystem: EventSystem

  beforeEach(() => {
    eventSystem = new EventSystem()
  })

  afterEach(() => {
    eventSystem.destroy()
  })

  describe('Event Listener Registration', () => {
    it('should register event listeners', () => {
      const callback = jest.fn()
      eventSystem.on('test:event', callback)

      expect(eventSystem.hasListeners('test:event')).toBe(true)
      expect(eventSystem.getListenerCount('test:event')).toBe(1)
    })

    it('should register multiple listeners for the same event', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      eventSystem.on('test:event', callback1)
      eventSystem.on('test:event', callback2)

      expect(eventSystem.getListenerCount('test:event')).toBe(2)
    })

    it('should register one-time listeners', () => {
      const callback = jest.fn()
      eventSystem.once('test:event', callback)

      expect(eventSystem.hasListeners('test:event')).toBe(true)
      expect(eventSystem.getListenerCount('test:event')).toBe(1)
    })

    it('should throw error for invalid event type', () => {
      const callback = jest.fn()
      expect(() => eventSystem.on('', callback)).toThrow(
        'Event type must be a non-empty string'
      )
      expect(() => eventSystem.on(null as any, callback)).toThrow(
        'Event type must be a non-empty string'
      )
    })

    it('should throw error for invalid callback', () => {
      expect(() => eventSystem.on('test:event', null as any)).toThrow(
        'Event callback must be a function'
      )
      expect(() =>
        eventSystem.on('test:event', 'not-a-function' as any)
      ).toThrow('Event callback must be a function')
    })
  })

  describe('Event Listener Removal', () => {
    it('should remove specific event listeners', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      eventSystem.on('test:event', callback1)
      eventSystem.on('test:event', callback2)

      expect(eventSystem.getListenerCount('test:event')).toBe(2)

      const removed = eventSystem.off('test:event', callback1)
      expect(removed).toBe(true)
      expect(eventSystem.getListenerCount('test:event')).toBe(1)
    })

    it('should return false when removing non-existent listener', () => {
      const callback = jest.fn()
      const removed = eventSystem.off('test:event', callback)
      expect(removed).toBe(false)
    })

    it('should remove all listeners for a specific event type', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      eventSystem.on('test:event', callback1)
      eventSystem.on('test:event', callback2)
      eventSystem.on('other:event', callback1)

      eventSystem.removeAllListeners('test:event')

      expect(eventSystem.hasListeners('test:event')).toBe(false)
      expect(eventSystem.hasListeners('other:event')).toBe(true)
    })

    it('should remove all listeners for all events', () => {
      const callback = jest.fn()

      eventSystem.on('test:event1', callback)
      eventSystem.on('test:event2', callback)

      eventSystem.removeAllListeners()

      expect(eventSystem.getListenerCount()).toBe(0)
    })
  })

  describe('Event Emission', () => {
    it('should emit events to registered listeners', () => {
      const callback = jest.fn()
      eventSystem.on('test:event', callback)

      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }

      const hasListeners = eventSystem.emit('test:event', eventData)

      expect(hasListeners).toBe(true)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test:event',
          data: { message: 'test' },
          timestamp: expect.any(Number),
        })
      )
    })

    it('should emit events to multiple listeners', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      eventSystem.on('test:event', callback1)
      eventSystem.on('test:event', callback2)

      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }

      eventSystem.emit('test:event', eventData)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should emit to once listeners and remove them', () => {
      const callback = jest.fn()
      eventSystem.once('test:event', callback)

      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }

      // First emission
      eventSystem.emit('test:event', eventData)
      expect(callback).toHaveBeenCalledTimes(1)
      expect(eventSystem.hasListeners('test:event')).toBe(false)

      // Second emission should not call the callback
      eventSystem.emit('test:event', eventData)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should return false when no listeners exist', () => {
      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }

      const hasListeners = eventSystem.emit('test:event', eventData)
      expect(hasListeners).toBe(false)
    })

    it('should handle errors in event listeners gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error')
      })
      const normalCallback = jest.fn()

      eventSystem.on('test:event', errorCallback)
      eventSystem.on('test:event', normalCallback)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }

      eventSystem.emit('test:event', eventData)

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(normalCallback).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event listener'),
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should validate event data', () => {
      expect(() => eventSystem.emit('test:event', null as any)).toThrow(
        'Event must be an object'
      )
      expect(() =>
        eventSystem.emit('test:event', { type: 'test' } as any)
      ).toThrow('Event must have a data property')
    })

    it('should add timestamp if not provided', () => {
      const callback = jest.fn()
      eventSystem.on('test:event', callback)

      const eventData = {
        type: 'test:event',
        data: { message: 'test' },
      } as FlowEvent

      eventSystem.emit('test:event', eventData)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
        })
      )
    })
  })

  describe('Specific Event Type Methods', () => {
    it('should emit node events', () => {
      const callback = jest.fn()
      eventSystem.on('node:created', callback)

      const nodeEvent: NodeEvent = {
        type: 'node:created',
        timestamp: Date.now(),
        data: {
          nodeId: 'node-1',
          node: { id: 'node-1' },
        },
      }

      const hasListeners = eventSystem.emitNodeEvent(nodeEvent)
      expect(hasListeners).toBe(true)
      expect(callback).toHaveBeenCalledWith(nodeEvent)
    })

    it('should emit edge events', () => {
      const callback = jest.fn()
      eventSystem.on('edge:created', callback)

      const edgeEvent: EdgeEvent = {
        type: 'edge:created',
        timestamp: Date.now(),
        data: {
          edgeId: 'edge-1',
          edge: { id: 'edge-1' },
        },
      }

      const hasListeners = eventSystem.emitEdgeEvent(edgeEvent)
      expect(hasListeners).toBe(true)
      expect(callback).toHaveBeenCalledWith(edgeEvent)
    })

    it('should emit interaction events', () => {
      const callback = jest.fn()
      eventSystem.on('drag:start', callback)

      const interactionEvent: InteractionEvent = {
        type: 'drag:start',
        timestamp: Date.now(),
        data: {
          elementId: 'node-1',
          position: { x: 100, y: 200 },
        },
      }

      const hasListeners = eventSystem.emitInteractionEvent(interactionEvent)
      expect(hasListeners).toBe(true)
      expect(callback).toHaveBeenCalledWith(interactionEvent)
    })

    it('should emit viewport events', () => {
      const callback = jest.fn()
      eventSystem.on('viewport:zoom', callback)

      const viewportEvent: ViewportEvent = {
        type: 'viewport:zoom',
        timestamp: Date.now(),
        data: {
          zoom: 1.5,
          position: { x: 0, y: 0 },
        },
      }

      const hasListeners = eventSystem.emitViewportEvent(viewportEvent)
      expect(hasListeners).toBe(true)
      expect(callback).toHaveBeenCalledWith(viewportEvent)
    })
  })

  describe('Event History', () => {
    it('should maintain event history', () => {
      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }

      eventSystem.emit('test:event', eventData)

      const history = eventSystem.getEventHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toMatchObject(eventData)
    })

    it('should filter event history by type', () => {
      const event1: FlowEvent = {
        type: 'test:event1',
        timestamp: Date.now(),
        data: { message: 'test1' },
      }

      const event2: FlowEvent = {
        type: 'test:event2',
        timestamp: Date.now(),
        data: { message: 'test2' },
      }

      eventSystem.emit('test:event1', event1)
      eventSystem.emit('test:event2', event2)

      const filteredHistory = eventSystem.getEventHistory('test:event1')
      expect(filteredHistory).toHaveLength(1)
      expect(filteredHistory[0].type).toBe('test:event1')
    })

    it('should limit event history', () => {
      const event1: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test1' },
      }

      const event2: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test2' },
      }

      eventSystem.emit('test:event', event1)
      eventSystem.emit('test:event', event2)

      const limitedHistory = eventSystem.getEventHistory(undefined, 1)
      expect(limitedHistory).toHaveLength(1)
      expect(limitedHistory[0].data.message).toBe('test2')
    })

    it('should clear event history', () => {
      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }

      eventSystem.emit('test:event', eventData)
      expect(eventSystem.getEventHistory()).toHaveLength(1)

      eventSystem.clearEventHistory()
      expect(eventSystem.getEventHistory()).toHaveLength(0)
    })

    it('should respect max history size', () => {
      eventSystem.setMaxHistorySize(2)

      for (let i = 0; i < 5; i++) {
        const eventData: FlowEvent = {
          type: 'test:event',
          timestamp: Date.now(),
          data: { message: `test${i}` },
        }
        eventSystem.emit('test:event', eventData)
      }

      const history = eventSystem.getEventHistory()
      expect(history).toHaveLength(2)
      expect(history[0].data.message).toBe('test3')
      expect(history[1].data.message).toBe('test4')
    })

    it('should throw error for negative max history size', () => {
      expect(() => eventSystem.setMaxHistorySize(-1)).toThrow(
        'Max history size must be non-negative'
      )
    })
  })

  describe('Utility Methods', () => {
    it('should get event types', () => {
      eventSystem.on('test:event1', jest.fn())
      eventSystem.on('test:event2', jest.fn())
      eventSystem.once('test:event3', jest.fn())

      const eventTypes = eventSystem.getEventTypes()
      expect(eventTypes).toContain('test:event1')
      expect(eventTypes).toContain('test:event2')
      expect(eventTypes).toContain('test:event3')
      expect(eventTypes).toHaveLength(3)
    })

    it('should get statistics', () => {
      eventSystem.on('test:event1', jest.fn())
      eventSystem.on('test:event1', jest.fn())
      eventSystem.on('test:event2', jest.fn())

      const eventData: FlowEvent = {
        type: 'test:event1',
        timestamp: Date.now(),
        data: { message: 'test' },
      }
      eventSystem.emit('test:event1', eventData)

      const stats = eventSystem.getStats()
      expect(stats.totalListeners).toBe(3)
      expect(stats.eventTypes).toBe(2)
      expect(stats.historySize).toBe(1)
      expect(stats.maxHistorySize).toBe(1000)
    })

    it('should handle max listeners warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const smallEventSystem = new EventSystem({ maxListeners: 2 })

      smallEventSystem.on('test:event', jest.fn())
      smallEventSystem.on('test:event', jest.fn())
      smallEventSystem.on('test:event', jest.fn()) // This should trigger warning

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Maximum number of listeners')
      )

      consoleSpy.mockRestore()
      smallEventSystem.destroy()
    })

    it('should support logging when enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const loggingEventSystem = new EventSystem({ enableLogging: true })

      const callback = jest.fn()
      loggingEventSystem.on('test:event', callback)

      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }
      loggingEventSystem.emit('test:event', eventData)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event listener registered')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event emitted'),
        expect.any(Object)
      )

      consoleSpy.mockRestore()
      loggingEventSystem.destroy()
    })
  })

  describe('Cleanup', () => {
    it('should destroy event system properly', () => {
      const callback = jest.fn()
      eventSystem.on('test:event', callback)

      const eventData: FlowEvent = {
        type: 'test:event',
        timestamp: Date.now(),
        data: { message: 'test' },
      }
      eventSystem.emit('test:event', eventData)

      eventSystem.destroy()

      expect(eventSystem.getListenerCount()).toBe(0)
      expect(eventSystem.getEventHistory()).toHaveLength(0)
    })
  })
})
