import { vi } from 'vitest'

// Mock DOM APIs that might not be available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Canvas APIs
global.CanvasRenderingContext2D = vi.fn().mockImplementation(() => ({}))
global.Path2D = vi.fn().mockImplementation(() => ({}))
global.HTMLCanvasElement = vi.fn().mockImplementation(() => ({
  getContext: vi.fn(() => ({})),
  width: 800,
  height: 600,
}))

// Mock PointerEvent
global.PointerEvent = vi.fn().mockImplementation(() => ({}))

// Mock additional Canvas-related globals
Object.defineProperty(window, 'CanvasRenderingContext2D', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({})),
})

Object.defineProperty(window, 'Path2D', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({})),
})

Object.defineProperty(window, 'PointerEvent', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({})),
})

// Mock the FlowEditor module to avoid Canvas issues
vi.mock('../../../dist', () => ({
  FlowEditor: vi.fn().mockImplementation(() => ({
    getAllNodes: () => [],
    getAllEdges: () => [],
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
    container: document.createElement('div'),
    options: {},
  })),
}))
