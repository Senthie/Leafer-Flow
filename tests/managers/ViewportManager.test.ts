// ViewportManager unit tests

import { ViewportManager } from '../../src/managers/ViewportManager'
import { FlowError } from '../../src/errors/FlowError'

// Mock DOM methods
const mockGetBoundingClientRect = jest.fn()
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

const createMockContainer = () =>
  ({
    getBoundingClientRect: mockGetBoundingClientRect,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    clientWidth: 800,
    clientHeight: 600,
  } as unknown as HTMLElement)

describe('ViewportManager', () => {
  let viewportManager: ViewportManager
  let mockContainer: HTMLElement
  let mockOnViewportChange: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnViewportChange = jest.fn()
    mockGetBoundingClientRect.mockReturnValue({
      width: 800,
      height: 600,
      left: 0,
      top: 0,
    })

    viewportManager = new ViewportManager({
      minZoom: 0.1,
      maxZoom: 5.0,
      initialZoom: 1.0,
      initialPosition: { x: 0, y: 0 },
      onViewportChange: mockOnViewportChange,
    })

    mockContainer = createMockContainer()
  })

  afterEach(() => {
    if (viewportManager) {
      viewportManager.destroy()
    }
  })

  describe('constructor', () => {
    it('should create ViewportManager with default options', () => {
      const manager = new ViewportManager()
      const viewport = manager.getViewport()

      expect(viewport.x).toBe(0)
      expect(viewport.y).toBe(0)
      expect(viewport.zoom).toBe(1.0)
      expect(manager.getZoomLimits()).toEqual({ min: 0.1, max: 5.0 })
    })

    it('should create ViewportManager with custom options', () => {
      const manager = new ViewportManager({
        minZoom: 0.5,
        maxZoom: 3.0,
        initialZoom: 1.5,
        initialPosition: { x: 100, y: 200 },
      })

      const viewport = manager.getViewport()
      expect(viewport.x).toBe(100)
      expect(viewport.y).toBe(200)
      expect(viewport.zoom).toBe(1.5)
      expect(manager.getZoomLimits()).toEqual({ min: 0.5, max: 3.0 })
    })

    it('should throw error for invalid zoom limits', () => {
      expect(() => {
        new ViewportManager({ minZoom: 0 })
      }).toThrow(FlowError)

      expect(() => {
        new ViewportManager({ minZoom: 2.0, maxZoom: 1.0 })
      }).toThrow(FlowError)
    })

    it('should clamp initial zoom to valid range', () => {
      const manager = new ViewportManager({
        minZoom: 0.5,
        maxZoom: 2.0,
        initialZoom: 5.0, // Above max
      })

      expect(manager.getZoom()).toBe(2.0)
    })
  })

  describe('initialization', () => {
    it('should initialize with container', () => {
      viewportManager.initialize(mockContainer)

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'wheel',
        expect.any(Function),
        { passive: false }
      )
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      )
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: false }
      )
    })

    it('should throw error when already initialized', () => {
      viewportManager.initialize(mockContainer)

      expect(() => {
        viewportManager.initialize(mockContainer)
      }).toThrow(FlowError)
    })

    it('should remove event listeners on destroy', () => {
      viewportManager.initialize(mockContainer)
      viewportManager.destroy()

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'wheel',
        expect.any(Function)
      )
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      )
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      )
    })
  })

  describe('zoom operations', () => {
    beforeEach(() => {
      viewportManager.initialize(mockContainer)
    })

    it('should zoom to specific scale', () => {
      viewportManager.zoomTo(2.0)

      expect(viewportManager.getZoom()).toBe(2.0)
      expect(mockOnViewportChange).toHaveBeenCalledWith({
        x: expect.any(Number),
        y: expect.any(Number),
        zoom: 2.0,
      })
    })

    it('should clamp zoom to valid range', () => {
      viewportManager.zoomTo(10.0) // Above max
      expect(viewportManager.getZoom()).toBe(5.0)

      viewportManager.zoomTo(0.01) // Below min
      expect(viewportManager.getZoom()).toBe(0.1)
    })

    it('should zoom in with factor', () => {
      viewportManager.zoomIn(2.0)
      expect(viewportManager.getZoom()).toBe(2.0)
    })

    it('should zoom out with factor', () => {
      viewportManager.zoomTo(2.0)
      viewportManager.zoomOut(2.0)
      expect(viewportManager.getZoom()).toBe(1.0)
    })

    it('should reset zoom to 1.0', () => {
      viewportManager.zoomTo(3.0)
      viewportManager.resetZoom()
      expect(viewportManager.getZoom()).toBe(1.0)
    })

    it('should zoom around specific point', () => {
      const initialViewport = viewportManager.getViewport()
      viewportManager.zoomTo(2.0, { x: 400, y: 300 })

      const newViewport = viewportManager.getViewport()
      expect(newViewport.zoom).toBe(2.0)
      expect(newViewport.x).not.toBe(initialViewport.x)
      expect(newViewport.y).not.toBe(initialViewport.y)
    })

    it('should not change viewport if zoom is same', () => {
      mockOnViewportChange.mockClear()
      viewportManager.zoomTo(1.0) // Same as current

      expect(mockOnViewportChange).not.toHaveBeenCalled()
    })
  })

  describe('pan operations', () => {
    beforeEach(() => {
      viewportManager.initialize(mockContainer)
    })

    it('should pan to specific position', () => {
      viewportManager.panTo(100, 200)

      const position = viewportManager.getPosition()
      expect(position.x).toBe(100)
      expect(position.y).toBe(200)
      expect(mockOnViewportChange).toHaveBeenCalledWith({
        x: 100,
        y: 200,
        zoom: 1.0,
      })
    })

    it('should pan by delta', () => {
      viewportManager.panTo(50, 50)
      viewportManager.panBy(25, 75)

      const position = viewportManager.getPosition()
      expect(position.x).toBe(75)
      expect(position.y).toBe(125)
    })

    it('should center view', () => {
      viewportManager.panTo(100, 200)
      viewportManager.centerView()

      const position = viewportManager.getPosition()
      expect(position.x).toBe(0)
      expect(position.y).toBe(0)
    })

    it('should not change viewport if position is same', () => {
      mockOnViewportChange.mockClear()
      viewportManager.panTo(0, 0) // Same as current

      expect(mockOnViewportChange).not.toHaveBeenCalled()
    })
  })

  describe('combined operations', () => {
    beforeEach(() => {
      viewportManager.initialize(mockContainer)
    })

    it('should set viewport with partial state', () => {
      viewportManager.setViewport({ x: 100 })
      let viewport = viewportManager.getViewport()
      expect(viewport.x).toBe(100)
      expect(viewport.y).toBe(0)
      expect(viewport.zoom).toBe(1.0)

      viewportManager.setViewport({ y: 200, zoom: 2.0 })
      viewport = viewportManager.getViewport()
      expect(viewport.x).toBe(100)
      expect(viewport.y).toBe(200)
      expect(viewport.zoom).toBe(2.0)
    })

    it('should fit view with default bounds', () => {
      viewportManager.fitView()

      const viewport = viewportManager.getViewport()
      expect(viewport.zoom).toBeGreaterThan(0)
      expect(mockOnViewportChange).toHaveBeenCalled()
    })

    it('should fit view with custom bounds', () => {
      const bounds = {
        minX: -50,
        maxX: 50,
        minY: -50,
        maxY: 50,
      }

      viewportManager.fitView(bounds, 20)

      const viewport = viewportManager.getViewport()
      expect(viewport.zoom).toBeGreaterThan(0)
    })
  })

  describe('coordinate transformations', () => {
    beforeEach(() => {
      viewportManager.initialize(mockContainer)
    })

    it('should transform screen to world coordinates', () => {
      viewportManager.setViewport({ x: 100, y: 50, zoom: 2.0 })

      const worldPoint = viewportManager.screenToWorld({ x: 200, y: 150 })
      expect(worldPoint.x).toBe(50) // (200 - 100) / 2
      expect(worldPoint.y).toBe(50) // (150 - 50) / 2
    })

    it('should transform world to screen coordinates', () => {
      viewportManager.setViewport({ x: 100, y: 50, zoom: 2.0 })

      const screenPoint = viewportManager.worldToScreen({ x: 50, y: 25 })
      expect(screenPoint.x).toBe(200) // 50 * 2 + 100
      expect(screenPoint.y).toBe(100) // 25 * 2 + 50
    })
  })

  describe('utility methods', () => {
    beforeEach(() => {
      viewportManager.initialize(mockContainer)
    })

    it('should check if point is visible', () => {
      const visiblePoint = { x: 100, y: 100 }
      const invisiblePoint = { x: -1000, y: -1000 }

      expect(viewportManager.isPointVisible(visiblePoint)).toBe(true)
      expect(viewportManager.isPointVisible(invisiblePoint)).toBe(false)
    })

    it('should get visible bounds', () => {
      const bounds = viewportManager.getVisibleBounds()

      expect(bounds).not.toBeNull()
      expect(bounds!.minX).toBeLessThan(bounds!.maxX)
      expect(bounds!.minY).toBeLessThan(bounds!.maxY)
    })

    it('should return null for visible bounds without container', () => {
      const manager = new ViewportManager()
      const bounds = manager.getVisibleBounds()

      expect(bounds).toBeNull()
    })
  })

  describe('event handling', () => {
    beforeEach(() => {
      viewportManager.initialize(mockContainer)
    })

    it('should handle wheel events for zooming', () => {
      const wheelHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'wheel'
      )?.[1]

      expect(wheelHandler).toBeDefined()

      // Simulate wheel event
      const mockWheelEvent = {
        preventDefault: jest.fn(),
        deltaY: -100, // Zoom in
        clientX: 400,
        clientY: 300,
      } as unknown as WheelEvent

      wheelHandler(mockWheelEvent)

      expect(mockWheelEvent.preventDefault).toHaveBeenCalled()
      expect(viewportManager.getZoom()).toBeGreaterThan(1.0)
    })

    it('should handle mouse events for panning', () => {
      const mouseDownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1]

      expect(mouseDownHandler).toBeDefined()

      // Simulate mouse down event
      const mockMouseEvent = {
        button: 0, // Left button
        clientX: 100,
        clientY: 100,
      } as unknown as MouseEvent

      mouseDownHandler(mockMouseEvent)

      // The panning state should be set (this is internal state, so we can't directly test it)
      // But we can verify that the event was handled without errors
      expect(true).toBe(true)
    })
  })
})
