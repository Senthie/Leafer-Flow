// InteractionSystem - handles user interactions like dragging, selection, and connection creation

import { FlowNode } from '../components/FlowNode'
import { FlowEdge } from '../components/FlowEdge'
import { FlowPort } from '../components/FlowPort'
import { InteractionEvent } from '../events/types'

export interface InteractionSystemOptions {
  onEvent?: (event: InteractionEvent) => void
  getNodeById?: (id: string) => FlowNode | null
  getEdgeById?: (id: string) => FlowEdge | null
  getAllNodes?: () => FlowNode[]
  getAllEdges?: () => FlowEdge[]
}

export interface DragState {
  isDragging: boolean
  draggedElements: Set<FlowNode>
  startPosition: { x: number; y: number }
  lastPosition: { x: number; y: number }
  dragOffset: Map<string, { x: number; y: number }>
}

export interface ConnectionState {
  isConnecting: boolean
  sourcePort: FlowPort | null
  tempEdge: any | null // Temporary visual connection line
  currentPosition: { x: number; y: number }
}

export interface SelectionState {
  selectedNodes: Set<FlowNode>
  selectedEdges: Set<FlowEdge>
  lastSelected: FlowNode | FlowEdge | null
}

export class InteractionSystem {
  private options: InteractionSystemOptions
  private dragState: DragState
  private connectionState: ConnectionState
  private selectionState: SelectionState
  private container: HTMLElement | null = null

  // Event listeners for cleanup
  private eventListeners: Array<{
    element: HTMLElement | Document
    event: string
    handler: EventListener
  }> = []

  constructor(options: InteractionSystemOptions = {}) {
    this.options = options

    // Initialize states
    this.dragState = {
      isDragging: false,
      draggedElements: new Set(),
      startPosition: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      dragOffset: new Map(),
    }

    this.connectionState = {
      isConnecting: false,
      sourcePort: null,
      tempEdge: null,
      currentPosition: { x: 0, y: 0 },
    }

    this.selectionState = {
      selectedNodes: new Set(),
      selectedEdges: new Set(),
      lastSelected: null,
    }
  }

  public initialize(container: HTMLElement): void {
    this.container = container
    this.setupEventListeners()
  }

  public destroy(): void {
    this.cleanup()
  }

  private setupEventListeners(): void {
    if (!this.container) return

    // Mouse events for dragging and selection
    this.addEventListener(
      this.container,
      'mousedown',
      this.handleMouseDown.bind(this)
    )
    this.addEventListener(
      document,
      'mousemove',
      this.handleMouseMove.bind(this)
    )
    this.addEventListener(document, 'mouseup', this.handleMouseUp.bind(this))

    // Keyboard events for selection and deletion
    this.addEventListener(document, 'keydown', this.handleKeyDown.bind(this))

    // Prevent context menu on right click
    this.addEventListener(this.container, 'contextmenu', e =>
      e.preventDefault()
    )
  }

  private addEventListener(
    element: HTMLElement | Document,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler)
    this.eventListeners.push({ element, event, handler })
  }

  private cleanup(): void {
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []

    // Clear states
    this.clearSelection()
    this.cancelDrag()
    this.cancelConnection()
  }

  // Mouse event handlers
  private handleMouseDown(event: Event): void {
    const mouseEvent = event as MouseEvent
    const target = this.getFlowElementFromEvent(mouseEvent)

    if (!target) {
      // Clicked on empty space - clear selection
      this.clearSelection()
      return
    }

    // Handle different element types
    if (target instanceof FlowNode) {
      this.handleNodeMouseDown(target, mouseEvent)
    } else if (target instanceof FlowEdge) {
      this.handleEdgeMouseDown(target, mouseEvent)
    } else if (target instanceof FlowPort) {
      this.handlePortMouseDown(target, mouseEvent)
    }
  }

  private handleMouseMove(event: Event): void {
    const mouseEvent = event as MouseEvent
    const currentPosition = { x: mouseEvent.clientX, y: mouseEvent.clientY }

    if (this.dragState.isDragging) {
      this.updateDrag(currentPosition)
    } else if (this.connectionState.isConnecting) {
      this.updateConnection(currentPosition)
    }
  }

  private handleMouseUp(event: Event): void {
    const mouseEvent = event as MouseEvent
    if (this.dragState.isDragging) {
      this.endDrag(mouseEvent)
    } else if (this.connectionState.isConnecting) {
      this.endConnection(mouseEvent)
    }
  }

  private handleKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent
    switch (keyboardEvent.key) {
      case 'Delete':
      case 'Backspace':
        this.deleteSelected()
        break
      case 'Escape':
        this.cancelDrag()
        this.cancelConnection()
        break
      case 'a':
        if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
          keyboardEvent.preventDefault()
          this.selectAll()
        }
        break
    }
  }

  // Node interaction handlers
  private handleNodeMouseDown(node: FlowNode, event: MouseEvent): void {
    event.preventDefault()

    // Handle selection
    if (!event.ctrlKey && !event.metaKey) {
      if (!this.selectionState.selectedNodes.has(node)) {
        this.clearSelection()
        this.selectNode(node)
      }
    } else {
      // Toggle selection with Ctrl/Cmd
      if (this.selectionState.selectedNodes.has(node)) {
        this.deselectNode(node)
      } else {
        this.selectNode(node)
      }
    }

    // Start drag if node is selected
    if (this.selectionState.selectedNodes.has(node)) {
      this.startDrag(event, this.selectionState.selectedNodes)
    }
  }

  private handleEdgeMouseDown(edge: FlowEdge, event: MouseEvent): void {
    event.preventDefault()

    // Handle edge selection
    if (!event.ctrlKey && !event.metaKey) {
      this.clearSelection()
    }

    if (this.selectionState.selectedEdges.has(edge)) {
      if (event.ctrlKey || event.metaKey) {
        this.deselectEdge(edge)
      }
    } else {
      this.selectEdge(edge)
    }
  }

  private handlePortMouseDown(port: FlowPort, event: MouseEvent): void {
    event.preventDefault()
    event.stopPropagation()

    // Start connection creation
    this.startConnection(port, event)
  }

  // Drag functionality
  private startDrag(event: MouseEvent, nodes: Set<FlowNode>): void {
    const startPosition = { x: event.clientX, y: event.clientY }

    this.dragState = {
      isDragging: true,
      draggedElements: new Set(nodes),
      startPosition,
      lastPosition: startPosition,
      dragOffset: new Map(),
    }

    // Calculate initial offsets for each node
    nodes.forEach(node => {
      const nodePos = node.position
      this.dragState.dragOffset.set(node.id, {
        x: startPosition.x - nodePos.x,
        y: startPosition.y - nodePos.y,
      })
    })

    this.emitEvent({
      type: 'drag:start',
      timestamp: Date.now(),
      data: {
        elementId: Array.from(nodes)[0]?.id,
        position: startPosition,
      },
    })
  }

  private updateDrag(currentPosition: { x: number; y: number }): void {
    if (!this.dragState.isDragging) return

    const delta = {
      x: currentPosition.x - this.dragState.lastPosition.x,
      y: currentPosition.y - this.dragState.lastPosition.y,
    }

    // Update positions of all dragged nodes
    this.dragState.draggedElements.forEach(node => {
      const offset = this.dragState.dragOffset.get(node.id)
      if (offset) {
        const newPosition = {
          x: currentPosition.x - offset.x,
          y: currentPosition.y - offset.y,
        }
        node.updatePosition(newPosition.x, newPosition.y)
      }
    })

    // Update connected edges
    this.updateConnectedEdges(this.dragState.draggedElements)

    this.dragState.lastPosition = currentPosition

    this.emitEvent({
      type: 'drag:move',
      timestamp: Date.now(),
      data: {
        position: currentPosition,
        delta,
      },
    })
  }

  private endDrag(event: MouseEvent): void {
    if (!this.dragState.isDragging) return

    const endPosition = { x: event.clientX, y: event.clientY }

    this.emitEvent({
      type: 'drag:end',
      timestamp: Date.now(),
      data: {
        position: endPosition,
        delta: {
          x: endPosition.x - this.dragState.startPosition.x,
          y: endPosition.y - this.dragState.startPosition.y,
        },
      },
    })

    this.cancelDrag()
  }

  private cancelDrag(): void {
    this.dragState = {
      isDragging: false,
      draggedElements: new Set(),
      startPosition: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      dragOffset: new Map(),
    }
  }

  // Connection functionality
  private startConnection(sourcePort: FlowPort, event: MouseEvent): void {
    const startPosition = { x: event.clientX, y: event.clientY }

    this.connectionState = {
      isConnecting: true,
      sourcePort,
      tempEdge: null, // Will be created when needed
      currentPosition: startPosition,
    }

    this.emitEvent({
      type: 'connection:start',
      timestamp: Date.now(),
      data: {
        elementId: sourcePort.id,
        position: startPosition,
      },
    })
  }

  private updateConnection(currentPosition: { x: number; y: number }): void {
    if (!this.connectionState.isConnecting) return

    this.connectionState.currentPosition = currentPosition

    // Update temporary connection line visual
    // This would be implemented with actual LeaferJS rendering
    // For now, we just track the position
  }

  private endConnection(event: MouseEvent): void {
    if (!this.connectionState.isConnecting) return

    const target = this.getFlowElementFromEvent(event)
    let connectionCreated = false

    if (target instanceof FlowPort && this.connectionState.sourcePort) {
      // Attempt to create connection
      if (this.canCreateConnection(this.connectionState.sourcePort, target)) {
        connectionCreated = true
        // Connection creation would be handled by EdgeManager
        // This system just handles the interaction
      }
    }

    this.emitEvent({
      type: 'connection:end',
      timestamp: Date.now(),
      data: {
        position: { x: event.clientX, y: event.clientY },
        connectionCreated,
        ...(this.connectionState.sourcePort?.id && {
          sourcePort: this.connectionState.sourcePort.id,
        }),
        ...(target instanceof FlowPort && { targetPort: target.id }),
      },
    })

    this.cancelConnection()
  }

  private cancelConnection(): void {
    // Clean up temporary visual elements
    if (this.connectionState.tempEdge) {
      // Remove temporary edge visual
      this.connectionState.tempEdge = null
    }

    this.connectionState = {
      isConnecting: false,
      sourcePort: null,
      tempEdge: null,
      currentPosition: { x: 0, y: 0 },
    }
  }

  private canCreateConnection(
    sourcePort: FlowPort,
    targetPort: FlowPort
  ): boolean {
    // Basic validation - more comprehensive validation would be in EdgeManager
    return sourcePort.canConnect(targetPort)
  }

  // Selection functionality
  public selectNode(node: FlowNode): void {
    if (!this.selectionState.selectedNodes.has(node)) {
      this.selectionState.selectedNodes.add(node)
      node.isSelected = true
      this.selectionState.lastSelected = node
    }
  }

  public deselectNode(node: FlowNode): void {
    if (this.selectionState.selectedNodes.has(node)) {
      this.selectionState.selectedNodes.delete(node)
      node.isSelected = false
      if (this.selectionState.lastSelected === node) {
        this.selectionState.lastSelected = null
      }
    }
  }

  public selectEdge(edge: FlowEdge): void {
    if (!this.selectionState.selectedEdges.has(edge)) {
      this.selectionState.selectedEdges.add(edge)
      edge.isSelected = true
      this.selectionState.lastSelected = edge
    }
  }

  public deselectEdge(edge: FlowEdge): void {
    if (this.selectionState.selectedEdges.has(edge)) {
      this.selectionState.selectedEdges.delete(edge)
      edge.isSelected = false
      if (this.selectionState.lastSelected === edge) {
        this.selectionState.lastSelected = null
      }
    }
  }

  public clearSelection(): void {
    // Deselect all nodes
    this.selectionState.selectedNodes.forEach(node => {
      node.isSelected = false
    })
    this.selectionState.selectedNodes.clear()

    // Deselect all edges
    this.selectionState.selectedEdges.forEach(edge => {
      edge.isSelected = false
    })
    this.selectionState.selectedEdges.clear()

    this.selectionState.lastSelected = null
  }

  public selectAll(): void {
    // Select all nodes
    if (this.options.getAllNodes) {
      const allNodes = this.options.getAllNodes()
      allNodes.forEach(node => this.selectNode(node))
    }

    // Select all edges
    if (this.options.getAllEdges) {
      const allEdges = this.options.getAllEdges()
      allEdges.forEach(edge => this.selectEdge(edge))
    }
  }

  public deleteSelected(): void {
    // This would trigger deletion through the appropriate managers
    // The InteractionSystem doesn't directly delete elements
    const selectedNodeIds = Array.from(this.selectionState.selectedNodes).map(
      node => node.id
    )
    const selectedEdgeIds = Array.from(this.selectionState.selectedEdges).map(
      edge => edge.id
    )

    if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
      // Emit event for deletion - actual deletion handled by managers
      this.emitEvent({
        type: 'selection:delete',
        timestamp: Date.now(),
        data: {
          nodeIds: selectedNodeIds,
          edgeIds: selectedEdgeIds,
        },
      })
    }
  }

  // Utility methods
  private getFlowElementFromEvent(
    _event: MouseEvent
  ): FlowNode | FlowEdge | FlowPort | null {
    // This is a simplified implementation
    // In a real implementation, this would use proper hit testing
    // with the LeaferJS scene graph

    // Look for data attributes or other identifiers
    // This is a placeholder implementation
    return null
  }

  private updateConnectedEdges(nodes: Set<FlowNode>): void {
    // Update all edges connected to the moved nodes
    // This would be implemented with access to the EdgeManager
    nodes.forEach(node => {
      node.getAllPorts().forEach(port => {
        port.getConnections().forEach((_edgeId: string) => {
          // Update edge path - would need access to EdgeManager
          // For now, this is a placeholder
        })
      })
    })
  }

  // Getters for current state
  public get isDragging(): boolean {
    return this.dragState.isDragging
  }

  public get isConnecting(): boolean {
    return this.connectionState.isConnecting
  }

  public getSelectedNodes(): FlowNode[] {
    return Array.from(this.selectionState.selectedNodes)
  }

  public getSelectedEdges(): FlowEdge[] {
    return Array.from(this.selectionState.selectedEdges)
  }

  public hasSelection(): boolean {
    return (
      this.selectionState.selectedNodes.size > 0 ||
      this.selectionState.selectedEdges.size > 0
    )
  }

  // Event emission
  private emitEvent(event: InteractionEvent): void {
    if (this.options.onEvent) {
      this.options.onEvent(event)
    }
  }
}
