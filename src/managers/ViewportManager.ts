// ViewportManager - manages canvas viewport operations (zoom, pan)

import { FlowError, FlowErrorType } from '../errors/FlowError'

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

export interface ViewportOptions {
  minZoom?: number
  maxZoom?: number
  initialZoom?: number
  initialPosition?: { x: number; y: number }
  onViewportChange?: (viewport: ViewportState) => void
}

export interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export class ViewportManager {
  private viewport: ViewportState
  private minZoom: number
  private maxZoom: number
  private onViewportChange: ((viewport: ViewportState) => void) | undefined
  private container: HTMLElement | null = null
  private isInitialized = false

  constructor(options: ViewportOptions = {}) {
    this.minZoom = options.minZoom ?? 0.1
    this.maxZoom = options.maxZoom ?? 5.0
    this.onViewportChange = options.onViewportChange

    // Validate zoom limits
    if (this.minZoom <= 0) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Minimum zoom must be greater than 0',
        { minZoom: this.minZoom }
      )
    }

    if (this.maxZoom <= this.minZoom) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Maximum zoom must be greater than minimum zoom',
        { minZoom: this.minZoom, maxZoom: this.maxZoom }
      )
    }

    // Initialize viewport state
    this.viewport = {
      x: options.initialPosition?.x ?? 0,
      y: options.initialPosition?.y ?? 0,
      zoom: this.clampZoom(options.initialZoom ?? 1.0),
    }
  }

  // Initialization
  public initialize(container: HTMLElement): void {
    if (this.isInitialized) {
      throw new FlowError(
        FlowErrorType.RENDER_ERROR,
        'ViewportManager is already initialized',
        { container: this.container }
      )
    }

    this.container = container
    this.setupEventListeners()
    this.isInitialized = true
  }

  public destroy(): void {
    if (this.container) {
      this.removeEventListeners()
      this.container = null
    }
    this.isInitialized = false
  }

  // Zoom operations
  public zoomTo(scale: number, center?: { x: number; y: number }): void {
    const previousZoom = this.viewport.zoom
    const newZoom = this.clampZoom(scale)

    if (newZoom === previousZoom) {
      return // No change needed
    }

    // If center point is provided, zoom around that point
    if (center) {
      this.zoomAroundPoint(newZoom, center)
    } else {
      // Zoom around current viewport center
      const containerRect = this.getContainerRect()
      if (containerRect) {
        const centerPoint = {
          x: containerRect.width / 2,
          y: containerRect.height / 2,
        }
        this.zoomAroundPoint(newZoom, centerPoint)
      } else {
        this.viewport.zoom = newZoom
      }
    }

    this.notifyViewportChange()
  }

  public zoomIn(factor: number = 1.2, center?: { x: number; y: number }): void {
    this.zoomTo(this.viewport.zoom * factor, center)
  }

  public zoomOut(
    factor: number = 1.2,
    center?: { x: number; y: number }
  ): void {
    this.zoomTo(this.viewport.zoom / factor, center)
  }

  public resetZoom(): void {
    this.zoomTo(1.0)
  }

  // Pan operations
  public panTo(x: number, y: number): void {
    if (this.viewport.x === x && this.viewport.y === y) {
      return // No change needed
    }

    this.viewport.x = x
    this.viewport.y = y
    this.notifyViewportChange()
  }

  public panBy(deltaX: number, deltaY: number): void {
    this.panTo(this.viewport.x + deltaX, this.viewport.y + deltaY)
  }

  public centerView(): void {
    this.panTo(0, 0)
  }

  // Combined operations
  public setViewport(viewport: Partial<ViewportState>): void {
    let changed = false

    if (viewport.x !== undefined && viewport.x !== this.viewport.x) {
      this.viewport.x = viewport.x
      changed = true
    }

    if (viewport.y !== undefined && viewport.y !== this.viewport.y) {
      this.viewport.y = viewport.y
      changed = true
    }

    if (viewport.zoom !== undefined) {
      const newZoom = this.clampZoom(viewport.zoom)
      if (newZoom !== this.viewport.zoom) {
        this.viewport.zoom = newZoom
        changed = true
      }
    }

    if (changed) {
      this.notifyViewportChange()
    }
  }

  public fitView(bounds?: ViewportBounds, padding: number = 50): void {
    if (!this.container) {
      return
    }

    const containerRect = this.getContainerRect()
    if (!containerRect) {
      return
    }

    // Use provided bounds or calculate from content
    const targetBounds = bounds || this.calculateContentBounds()
    if (!targetBounds) {
      return
    }

    // Calculate the scale needed to fit the bounds
    const availableWidth = containerRect.width - padding * 2
    const availableHeight = containerRect.height - padding * 2
    const contentWidth = targetBounds.maxX - targetBounds.minX
    const contentHeight = targetBounds.maxY - targetBounds.minY

    if (contentWidth <= 0 || contentHeight <= 0) {
      return
    }

    const scaleX = availableWidth / contentWidth
    const scaleY = availableHeight / contentHeight
    const scale = this.clampZoom(Math.min(scaleX, scaleY))

    // Calculate the center position
    const contentCenterX = (targetBounds.minX + targetBounds.maxX) / 2
    const contentCenterY = (targetBounds.minY + targetBounds.maxY) / 2
    const viewportCenterX = containerRect.width / 2
    const viewportCenterY = containerRect.height / 2

    const x = viewportCenterX - contentCenterX * scale
    const y = viewportCenterY - contentCenterY * scale

    this.setViewport({ x, y, zoom: scale })
  }

  // Getters
  public getViewport(): ViewportState {
    return { ...this.viewport }
  }

  public getZoom(): number {
    return this.viewport.zoom
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.viewport.x, y: this.viewport.y }
  }

  public getZoomLimits(): { min: number; max: number } {
    return { min: this.minZoom, max: this.maxZoom }
  }

  // Coordinate transformations
  public screenToWorld(screenPoint: { x: number; y: number }): {
    x: number
    y: number
  } {
    return {
      x: (screenPoint.x - this.viewport.x) / this.viewport.zoom,
      y: (screenPoint.y - this.viewport.y) / this.viewport.zoom,
    }
  }

  public worldToScreen(worldPoint: { x: number; y: number }): {
    x: number
    y: number
  } {
    return {
      x: worldPoint.x * this.viewport.zoom + this.viewport.x,
      y: worldPoint.y * this.viewport.zoom + this.viewport.y,
    }
  }

  // Utility methods
  public isPointVisible(
    point: { x: number; y: number },
    margin: number = 0
  ): boolean {
    const containerRect = this.getContainerRect()
    if (!containerRect) {
      return false
    }

    const screenPoint = this.worldToScreen(point)
    return (
      screenPoint.x >= -margin &&
      screenPoint.x <= containerRect.width + margin &&
      screenPoint.y >= -margin &&
      screenPoint.y <= containerRect.height + margin
    )
  }

  public getVisibleBounds(): ViewportBounds | null {
    const containerRect = this.getContainerRect()
    if (!containerRect) {
      return null
    }

    const topLeft = this.screenToWorld({ x: 0, y: 0 })
    const bottomRight = this.screenToWorld({
      x: containerRect.width,
      y: containerRect.height,
    })

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y,
    }
  }

  // Private methods
  private clampZoom(zoom: number): number {
    return Math.max(this.minZoom, Math.min(this.maxZoom, zoom))
  }

  private zoomAroundPoint(
    newZoom: number,
    center: { x: number; y: number }
  ): void {
    const previousZoom = this.viewport.zoom
    const zoomRatio = newZoom / previousZoom

    // Calculate new position to keep the center point fixed
    const newX = center.x - (center.x - this.viewport.x) * zoomRatio
    const newY = center.y - (center.y - this.viewport.y) * zoomRatio

    this.viewport.zoom = newZoom
    this.viewport.x = newX
    this.viewport.y = newY
  }

  private getContainerRect(): { width: number; height: number } | null {
    if (!this.container) {
      return null
    }

    const rect = this.container.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
    }
  }

  private calculateContentBounds(): ViewportBounds | null {
    // This would typically calculate bounds from all nodes and edges
    // For now, return a default bounds - this will be enhanced when integrating with other managers
    return {
      minX: -100,
      maxX: 100,
      minY: -100,
      maxY: 100,
    }
  }

  private notifyViewportChange(): void {
    if (this.onViewportChange) {
      this.onViewportChange(this.getViewport())
    }
  }

  // Event handling
  private setupEventListeners(): void {
    if (!this.container) {
      return
    }

    // Mouse wheel for zooming
    this.container.addEventListener('wheel', this.handleWheel, {
      passive: false,
    })

    // Mouse events for panning
    this.container.addEventListener('mousedown', this.handleMouseDown)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)

    // Touch events for mobile support
    this.container.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    })
    this.container.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    })
    this.container.addEventListener('touchend', this.handleTouchEnd)
  }

  private removeEventListeners(): void {
    if (!this.container) {
      return
    }

    this.container.removeEventListener('wheel', this.handleWheel)
    this.container.removeEventListener('mousedown', this.handleMouseDown)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    this.container.removeEventListener('touchstart', this.handleTouchStart)
    this.container.removeEventListener('touchmove', this.handleTouchMove)
    this.container.removeEventListener('touchend', this.handleTouchEnd)
  }

  // Event handlers
  private isPanning = false
  private lastPanPoint: { x: number; y: number } | null = null

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault()

    const rect = this.container!.getBoundingClientRect()
    const centerPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    // Determine zoom direction and factor
    const zoomFactor = 1.1
    if (event.deltaY < 0) {
      this.zoomIn(zoomFactor, centerPoint)
    } else {
      this.zoomOut(zoomFactor, centerPoint)
    }
  }

  private handleMouseDown = (event: MouseEvent): void => {
    // Only start panning on left mouse button and if not clicking on interactive elements
    if (event.button !== 0) {
      return
    }

    // Check if we're clicking on empty space (this would need integration with other systems)
    // For now, we'll assume any mousedown can start panning
    this.startPanning(event.clientX, event.clientY)
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (this.isPanning && this.lastPanPoint) {
      const deltaX = event.clientX - this.lastPanPoint.x
      const deltaY = event.clientY - this.lastPanPoint.y

      this.panBy(deltaX, deltaY)
      this.lastPanPoint = { x: event.clientX, y: event.clientY }
    }
  }

  private handleMouseUp = (): void => {
    this.stopPanning()
  }

  // Touch event handlers for mobile support
  private lastTouchDistance: number | null = null
  private lastTouchCenter: { x: number; y: number } | null = null

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 1) {
      // Single touch - start panning
      const touch = event.touches[0]
      this.startPanning(touch.clientX, touch.clientY)
    } else if (event.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      event.preventDefault()
      this.stopPanning()

      const touch1 = event.touches[0]
      const touch2 = event.touches[1]

      this.lastTouchDistance = this.getTouchDistance(touch1, touch2)
      this.lastTouchCenter = this.getTouchCenter(touch1, touch2)
    }
  }

  private handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length === 1 && this.isPanning) {
      // Single touch - continue panning
      const touch = event.touches[0]
      if (this.lastPanPoint) {
        const deltaX = touch.clientX - this.lastPanPoint.x
        const deltaY = touch.clientY - this.lastPanPoint.y

        this.panBy(deltaX, deltaY)
        this.lastPanPoint = { x: touch.clientX, y: touch.clientY }
      }
    } else if (event.touches.length === 2) {
      // Two touches - handle pinch zoom
      event.preventDefault()

      const touch1 = event.touches[0]
      const touch2 = event.touches[1]

      const currentDistance = this.getTouchDistance(touch1, touch2)
      const currentCenter = this.getTouchCenter(touch1, touch2)

      if (this.lastTouchDistance && this.lastTouchCenter) {
        const zoomFactor = currentDistance / this.lastTouchDistance
        const rect = this.container!.getBoundingClientRect()
        const centerPoint = {
          x: currentCenter.x - rect.left,
          y: currentCenter.y - rect.top,
        }

        this.zoomTo(this.viewport.zoom * zoomFactor, centerPoint)
      }

      this.lastTouchDistance = currentDistance
      this.lastTouchCenter = currentCenter
    }
  }

  private handleTouchEnd = (): void => {
    this.stopPanning()
    this.lastTouchDistance = null
    this.lastTouchCenter = null
  }

  private startPanning(x: number, y: number): void {
    this.isPanning = true
    this.lastPanPoint = { x, y }
  }

  private stopPanning(): void {
    this.isPanning = false
    this.lastPanPoint = null
  }

  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getTouchCenter(
    touch1: Touch,
    touch2: Touch
  ): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    }
  }
}
