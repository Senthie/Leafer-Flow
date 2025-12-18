// Jest setup file for Leafer-Flow tests

// Mock LeaferJS components
jest.mock('leafer-ui', () => ({
  Group: class MockGroup {
    private _x = 0
    private _y = 0
    children: any[] = []
    tag?: string

    get x() {
      return this._x
    }
    set x(value: number) {
      this._x = value
    }

    get y() {
      return this._y
    }
    set y(value: number) {
      this._y = value
    }

    add(child: any) {
      this.children.push(child)
    }

    remove(child: any) {
      const index = this.children.indexOf(child)
      if (index > -1) {
        this.children.splice(index, 1)
      }
    }
  },
  Rect: class MockRect {
    width = 0
    height = 0
    fill = ''
    stroke = ''
    strokeWidth = 0
    cornerRadius = 0
    x = 0
    y = 0
    tag?: string

    constructor(props: any) {
      Object.assign(this, props)
    }
  },
  Text: class MockText {
    text = ''
    fontSize = 12
    fill = ''
    textAlign = ''
    verticalAlign = ''
    x = 0
    y = 0

    constructor(props: any) {
      Object.assign(this, props)
    }
  },
  Path: class MockPath {
    path = ''
    stroke = ''
    strokeWidth = 0
    fill = ''
    strokeLinecap = ''
    strokeLinejoin = ''
    data: any = {}

    constructor(props: any) {
      Object.assign(this, props)
    }
  },
}))

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16)
}

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}
