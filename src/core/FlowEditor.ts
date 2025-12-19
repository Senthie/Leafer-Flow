// Main FlowEditor class - entry point for Leafer-Flow

import { App, Leafer, Group, Rect } from 'leafer-ui'
import { FlowOptions, NodeData, EdgeData, PortData } from '../types'
import { FlowNode } from '../components/FlowNode'
import { FlowEdge } from '../components/FlowEdge'
import { NodeManager } from '../managers/NodeManager'
import { EdgeManager } from '../managers/EdgeManager'
import { ViewportManager, ViewportState } from '../managers/ViewportManager'
import {
  SerializationManager,
  SerializationOptions,
} from '../managers/SerializationManager'
import { InteractionSystem } from '../systems/InteractionSystem'
import { EventSystem, EventCallback } from '../systems/EventSystem'
import { HistorySystem } from '../systems/HistorySystem'
import { PerformanceSystem } from '../systems/PerformanceSystem'
import { NodeRenderer } from '../rendering/NodeRenderer'
import { EdgeRenderer, EdgePathType } from '../rendering/EdgeRenderer'
import {
  NodeEvent,
  EdgeEvent,
  InteractionEvent,
  FlowEvent,
} from '../events/types'

export class FlowEditor {
  private _container: HTMLElement
  private _options: FlowOptions
  private nodeManager: NodeManager
  private edgeManager: EdgeManager
  private viewportManager: ViewportManager
  private interactionSystem: InteractionSystem
  private eventSystem: EventSystem
  private historySystem: HistorySystem
  private performanceSystem: PerformanceSystem
  private nodeRenderer: NodeRenderer
  private edgeRenderer: EdgeRenderer

  // LeaferJS rendering layer
  private leaferApp: App | null = null
  private contentLayer: Leafer | null = null
  private nodesGroup: Group | null = null
  private edgesGroup: Group | null = null
  private gridLayer: Leafer | null = null

  constructor(container: HTMLElement, options: Partial<FlowOptions> = {}) {
    this._container = container
    this._options = {
      container,
      width: options.width || container.clientWidth,
      height: options.height || container.clientHeight,
      background: options.background || '#ffffff',
      grid: options.grid ?? true,
      minimap: options.minimap ?? false,
      controls: options.controls ?? true,
      nodeTypes: options.nodeTypes || {},
      edgeTypes: options.edgeTypes || {},
      // Advanced options
      enableHistory: options.enableHistory ?? true,
      maxHistorySize: options.maxHistorySize ?? 100,
      enablePerformanceOptimization:
        options.enablePerformanceOptimization ?? true,
      maxVisibleNodes: options.maxVisibleNodes ?? 1000,
      maxVisibleEdges: options.maxVisibleEdges ?? 2000,
      enableLevelOfDetail: options.enableLevelOfDetail ?? true,
      lodThreshold: options.lodThreshold ?? 0.5,
    }

    // Initialize EventSystem first
    this.eventSystem = new EventSystem({
      maxListeners: 1000,
      enableLogging: false, // Can be made configurable
    })

    // Initialize advanced systems
    this.historySystem = new HistorySystem({
      maxHistorySize: this._options.maxHistorySize || 100,
      enableLogging: false,
    })

    this.performanceSystem = new PerformanceSystem({
      enableVirtualization: this._options.enablePerformanceOptimization || true,
      maxVisibleNodes: this._options.maxVisibleNodes || 1000,
      maxVisibleEdges: this._options.maxVisibleEdges || 2000,
      enableLevelOfDetail: this._options.enableLevelOfDetail || true,
      lodThreshold: this._options.lodThreshold || 0.5,
    })

    this.nodeRenderer = new NodeRenderer()
    this.edgeRenderer = new EdgeRenderer()

    // Initialize NodeManager with event handling
    this.nodeManager = new NodeManager({
      nodeTypes: this._options.nodeTypes,
      onEvent: this.handleNodeEvent.bind(this),
    })

    // Initialize EdgeManager with event handling
    this.edgeManager = new EdgeManager({
      edgeTypes: this._options.edgeTypes,
      onEvent: this.handleEdgeEvent.bind(this),
    })

    // Initialize ViewportManager with event handling
    this.viewportManager = new ViewportManager({
      minZoom: 0.1,
      maxZoom: 5.0,
      initialZoom: 1.0,
      initialPosition: { x: 0, y: 0 },
      onViewportChange: this.handleViewportChange.bind(this),
    })

    // Initialize InteractionSystem with event handling
    this.interactionSystem = new InteractionSystem({
      onEvent: this.handleInteractionEvent.bind(this),
      getNodeById: (id: string) => this.nodeManager.getNode(id),
      getEdgeById: (id: string) => this.edgeManager.getEdge(id),
      getAllNodes: () => this.nodeManager.getAllNodes(),
      getAllEdges: () => this.edgeManager.getAllEdges(),
    })

    this.initialize()
  }

  private initialize(): void {
    // Initialize LeaferJS App
    this.initializeLeaferApp()

    // Initialize viewport manager with container
    this.viewportManager.initialize(this._container)

    // Initialize interaction system with container
    this.interactionSystem.initialize(this._container)
  }

  private initializeLeaferApp(): void {
    // Get container dimensions
    const width = this._options.width || this._container.clientWidth || 800
    const height = this._options.height || this._container.clientHeight || 600

    // Create LeaferJS App with multiple layers
    this.leaferApp = new App({
      view: this._container,
      width,
      height,
    })

    // Create grid layer (background)
    if (this._options.grid) {
      this.gridLayer = this.leaferApp.addLeafer()
      this.renderGrid()
    }

    // Create content layer for nodes and edges
    this.contentLayer = this.leaferApp.addLeafer()

    // Create groups for organizing elements
    this.edgesGroup = new Group()
    this.nodesGroup = new Group()

    // Add groups to content layer (edges below nodes)
    this.contentLayer.add(this.edgesGroup)
    this.contentLayer.add(this.nodesGroup)

    // Set background color
    if (this._options.background) {
      const background = new Rect({
        width: this._options.width,
        height: this._options.height,
        fill: this._options.background,
      })
      if (this.gridLayer) {
        this.gridLayer.add(background)
      } else {
        this.contentLayer.add(background)
      }
    }

    console.log('LeaferJS App initialized', {
      width: this._options.width,
      height: this._options.height,
      grid: this._options.grid,
    })
  }

  private renderGrid(): void {
    if (!this.gridLayer) return

    const gridSize = 20
    const width = this._options.width || 800
    const height = this._options.height || 600
    const gridColor = '#e0e0e0'

    // Create vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      const line = new Rect({
        x,
        y: 0,
        width: 1,
        height,
        fill: gridColor,
      })
      this.gridLayer.add(line)
    }

    // Create horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      const line = new Rect({
        x: 0,
        y,
        width,
        height: 1,
        fill: gridColor,
      })
      this.gridLayer.add(line)
    }
  }

  // Add node to the rendering layer
  private addNodeToRenderLayer(node: FlowNode): void {
    if (this.nodesGroup) {
      this.nodesGroup.add(node)
    }
  }

  // Remove node from the rendering layer
  private removeNodeFromRenderLayer(node: FlowNode): void {
    if (this.nodesGroup && node.parent === this.nodesGroup) {
      this.nodesGroup.remove(node)
    }
  }

  // Add edge to the rendering layer
  private addEdgeToRenderLayer(edge: FlowEdge): void {
    if (this.edgesGroup) {
      this.edgesGroup.add(edge)
    }
  }

  // Remove edge from the rendering layer
  private removeEdgeFromRenderLayer(edge: FlowEdge): void {
    if (this.edgesGroup && edge.parent === this.edgesGroup) {
      this.edgesGroup.remove(edge)
    }
  }

  private handleNodeEvent(event: NodeEvent): void {
    // Handle node events from NodeManager
    console.log('Node event:', event.type, event.data)

    // Handle node deletion - remove related edges
    if (event.type === 'node:deleted' && event.data.nodeId) {
      this.edgeManager.deleteEdgesByNode(event.data.nodeId)
    }

    // Emit event through the centralized event system
    this.eventSystem.emitNodeEvent(event)
  }

  private handleEdgeEvent(event: EdgeEvent): void {
    // Handle edge events from EdgeManager
    console.log('Edge event:', event.type, event.data)

    // Emit event through the centralized event system
    this.eventSystem.emitEdgeEvent(event)
  }

  private handleInteractionEvent(event: InteractionEvent): void {
    // Handle interaction events from InteractionSystem
    console.log('Interaction event:', event.type, event.data)

    // Handle selection deletion
    if (event.type === 'selection:delete') {
      const { nodeIds, edgeIds } = event.data

      // Delete selected edges first
      if (edgeIds) {
        edgeIds.forEach(edgeId => this.removeEdge(edgeId))
      }

      // Delete selected nodes (this will also delete connected edges)
      if (nodeIds) {
        nodeIds.forEach(nodeId => this.removeNode(nodeId))
      }
    }

    // Handle connection creation
    if (event.type === 'connection:end' && event.data.connectionCreated) {
      // Connection creation logic would be implemented here
      // For now, this is handled by the interaction system validation
    }

    // Emit event through the centralized event system
    this.eventSystem.emitInteractionEvent(event)
  }

  private handleViewportChange(viewport: ViewportState): void {
    // Handle viewport changes from ViewportManager
    console.log('Viewport changed:', viewport)

    // Emit viewport change event through the centralized event system
    this.eventSystem.emit('viewport:changed', {
      type: 'viewport:changed',
      timestamp: Date.now(),
      data: { viewport },
    })
  }

  // Getters for private properties
  public get container(): HTMLElement {
    return this._container
  }

  public get options(): FlowOptions {
    return this._options
  }

  // Node operations
  public addNode(nodeData: NodeData): FlowNode {
    const node = this.nodeManager.createNode(nodeData)

    // Add node to the rendering layer
    this.addNodeToRenderLayer(node)

    // Record action for undo/redo
    this.historySystem.recordAction({
      type: 'node:create',
      timestamp: Date.now(),
      data: { nodeData },
      undo: () => {
        const nodeToRemove = this.nodeManager.getNode(nodeData.id)
        if (nodeToRemove) {
          this.removeNodeFromRenderLayer(nodeToRemove)
        }
        this.nodeManager.deleteNode(nodeData.id)
      },
      redo: () => {
        const restoredNode = this.nodeManager.createNode(nodeData)
        this.addNodeToRenderLayer(restoredNode)
      },
    })

    // Invalidate performance cache
    this.performanceSystem.invalidateCache()

    return node
  }

  public removeNode(nodeId: string): boolean {
    const node = this.nodeManager.getNode(nodeId)
    if (!node) {
      return false
    }

    // Store node data for undo
    const nodeData: NodeData = {
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      ports: node.getAllPorts().map(port => {
        const portData: PortData = {
          id: port.id,
          type: port.type,
          multiple: port.multiple,
          position: port.position,
        }
        if (port.dataType) {
          portData.dataType = port.dataType
        }
        return portData
      }),
    }

    // Store connected edges for undo
    const connectedEdges = this.edgeManager.getEdgesByNode(nodeId)
    const edgesData = connectedEdges.map(edge => ({
      id: edge.id,
      source: edge.source.id,
      sourcePort: edge.sourcePort.id,
      target: edge.target.id,
      targetPort: edge.targetPort.id,
      data: edge.edgeData,
    }))

    // Remove connected edges from render layer first
    connectedEdges.forEach(edge => {
      this.removeEdgeFromRenderLayer(edge)
    })

    // Remove node from render layer
    this.removeNodeFromRenderLayer(node)

    const result = this.nodeManager.deleteNode(nodeId)

    if (result) {
      // Record action for undo/redo
      this.historySystem.recordAction({
        type: 'node:delete',
        timestamp: Date.now(),
        data: { nodeData, edgesData },
        undo: () => {
          const restoredNode = this.nodeManager.createNode(nodeData)
          this.addNodeToRenderLayer(restoredNode)
          // Restore edges
          edgesData.forEach(edgeData => {
            const sourceNode = this.nodeManager.getNode(edgeData.source)
            const targetNode = this.nodeManager.getNode(edgeData.target)
            if (sourceNode && targetNode) {
              const restoredEdge = this.edgeManager.createEdge(
                edgeData,
                sourceNode,
                targetNode
              )
              this.addEdgeToRenderLayer(restoredEdge)
            }
          })
        },
        redo: () => {
          const nodeToRemove = this.nodeManager.getNode(nodeId)
          if (nodeToRemove) {
            this.removeNodeFromRenderLayer(nodeToRemove)
          }
          this.nodeManager.deleteNode(nodeId)
        },
      })

      // Invalidate performance cache
      this.performanceSystem.invalidateCache()
    }

    return result
  }

  public getNode(nodeId: string): FlowNode | null {
    return this.nodeManager.getNode(nodeId)
  }

  public getAllNodes(): FlowNode[] {
    return this.nodeManager.getAllNodes()
  }

  // Additional node operations exposed from NodeManager
  public updateNode(nodeId: string, updates: Partial<NodeData>): FlowNode {
    return this.nodeManager.updateNode(nodeId, updates)
  }

  public selectNode(nodeId: string): boolean {
    return this.nodeManager.selectNode(nodeId)
  }

  public deselectNode(nodeId: string): boolean {
    return this.nodeManager.deselectNode(nodeId)
  }

  public getSelectedNodes(): FlowNode[] {
    return this.nodeManager.getSelectedNodes()
  }

  public clearSelection(): void {
    this.nodeManager.clearSelection()
    this.edgeManager.clearSelection()
    this.interactionSystem.clearSelection()
  }

  // Edge operations
  public addEdge(edgeData: EdgeData): FlowEdge {
    const sourceNode = this.nodeManager.getNode(edgeData.source)
    const targetNode = this.nodeManager.getNode(edgeData.target)

    if (!sourceNode) {
      throw new Error(`Source node '${edgeData.source}' not found`)
    }

    if (!targetNode) {
      throw new Error(`Target node '${edgeData.target}' not found`)
    }

    const edge = this.edgeManager.createEdge(edgeData, sourceNode, targetNode)

    // Add edge to the rendering layer
    this.addEdgeToRenderLayer(edge)

    // Record action for undo/redo
    this.historySystem.recordAction({
      type: 'edge:create',
      timestamp: Date.now(),
      data: { edgeData },
      undo: () => {
        const edgeToRemove = this.edgeManager.getEdge(edgeData.id)
        if (edgeToRemove) {
          this.removeEdgeFromRenderLayer(edgeToRemove)
        }
        this.edgeManager.deleteEdge(edgeData.id)
      },
      redo: () => {
        const srcNode = this.nodeManager.getNode(edgeData.source)
        const tgtNode = this.nodeManager.getNode(edgeData.target)
        if (srcNode && tgtNode) {
          const restoredEdge = this.edgeManager.createEdge(
            edgeData,
            srcNode,
            tgtNode
          )
          this.addEdgeToRenderLayer(restoredEdge)
        }
      },
    })

    // Invalidate performance cache
    this.performanceSystem.invalidateCache()

    return edge
  }

  public removeEdge(edgeId: string): boolean {
    const edge = this.edgeManager.getEdge(edgeId)
    if (!edge) {
      return false
    }

    // Store edge data for undo
    const edgeData: EdgeData = {
      id: edge.id,
      source: edge.source.id,
      sourcePort: edge.sourcePort.id,
      target: edge.target.id,
      targetPort: edge.targetPort.id,
      data: edge.edgeData,
    }

    // Remove edge from render layer
    this.removeEdgeFromRenderLayer(edge)

    const result = this.edgeManager.deleteEdge(edgeId)

    if (result) {
      // Record action for undo/redo
      this.historySystem.recordAction({
        type: 'edge:delete',
        timestamp: Date.now(),
        data: { edgeData },
        undo: () => {
          const sourceNode = this.nodeManager.getNode(edgeData.source)
          const targetNode = this.nodeManager.getNode(edgeData.target)
          if (sourceNode && targetNode) {
            const restoredEdge = this.edgeManager.createEdge(
              edgeData,
              sourceNode,
              targetNode
            )
            this.addEdgeToRenderLayer(restoredEdge)
          }
        },
        redo: () => {
          const edgeToRemove = this.edgeManager.getEdge(edgeId)
          if (edgeToRemove) {
            this.removeEdgeFromRenderLayer(edgeToRemove)
          }
          this.edgeManager.deleteEdge(edgeId)
        },
      })

      // Invalidate performance cache
      this.performanceSystem.invalidateCache()
    }

    return result
  }

  public getEdge(edgeId: string): FlowEdge | null {
    return this.edgeManager.getEdge(edgeId)
  }

  public getAllEdges(): FlowEdge[] {
    return this.edgeManager.getAllEdges()
  }

  // Additional edge operations exposed from EdgeManager
  public updateEdge(edgeId: string, updates: Partial<EdgeData>): FlowEdge {
    return this.edgeManager.updateEdge(edgeId, updates)
  }

  public selectEdge(edgeId: string): boolean {
    return this.edgeManager.selectEdge(edgeId)
  }

  public deselectEdge(edgeId: string): boolean {
    return this.edgeManager.deselectEdge(edgeId)
  }

  public getSelectedEdges(): FlowEdge[] {
    return this.edgeManager.getSelectedEdges()
  }

  public canConnect(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): { canConnect: boolean; reason?: string } {
    const sourceNode = this.nodeManager.getNode(sourceNodeId)
    const targetNode = this.nodeManager.getNode(targetNodeId)

    if (!sourceNode) {
      return {
        canConnect: false,
        reason: `Source node '${sourceNodeId}' not found`,
      }
    }

    if (!targetNode) {
      return {
        canConnect: false,
        reason: `Target node '${targetNodeId}' not found`,
      }
    }

    return this.edgeManager.canConnect(
      sourceNode,
      sourcePortId,
      targetNode,
      targetPortId
    )
  }

  // View control
  public zoomTo(scale: number, center?: { x: number; y: number }): void {
    this.viewportManager.zoomTo(scale, center)
  }

  public zoomIn(factor?: number, center?: { x: number; y: number }): void {
    this.viewportManager.zoomIn(factor, center)
  }

  public zoomOut(factor?: number, center?: { x: number; y: number }): void {
    this.viewportManager.zoomOut(factor, center)
  }

  public resetZoom(): void {
    this.viewportManager.resetZoom()
  }

  public panTo(x: number, y: number): void {
    this.viewportManager.panTo(x, y)
  }

  public panBy(deltaX: number, deltaY: number): void {
    this.viewportManager.panBy(deltaX, deltaY)
  }

  public centerView(): void {
    this.viewportManager.centerView()
  }

  public fitView(): void {
    this.viewportManager.fitView()
  }

  public getViewport(): ViewportState {
    return this.viewportManager.getViewport()
  }

  public setViewport(viewport: Partial<ViewportState>): void {
    this.viewportManager.setViewport(viewport)
  }

  // Coordinate transformations
  public screenToWorld(screenPoint: { x: number; y: number }): {
    x: number
    y: number
  } {
    return this.viewportManager.screenToWorld(screenPoint)
  }

  public worldToScreen(worldPoint: { x: number; y: number }): {
    x: number
    y: number
  } {
    return this.viewportManager.worldToScreen(worldPoint)
  }

  // Event system - Public API
  public on<T extends FlowEvent = FlowEvent>(
    event: string,
    callback: EventCallback<T>
  ): void {
    this.eventSystem.on(event, callback)
  }

  public once<T extends FlowEvent = FlowEvent>(
    event: string,
    callback: EventCallback<T>
  ): void {
    this.eventSystem.once(event, callback)
  }

  public off<T extends FlowEvent = FlowEvent>(
    event: string,
    callback: EventCallback<T>
  ): void {
    this.eventSystem.off(event, callback)
  }

  public removeAllListeners(event?: string): void {
    this.eventSystem.removeAllListeners(event)
  }

  public emit<T extends FlowEvent = FlowEvent>(
    event: string,
    eventData: T
  ): boolean {
    return this.eventSystem.emit(event, eventData)
  }

  // Event system utility methods
  public getListenerCount(event?: string): number {
    return this.eventSystem.getListenerCount(event)
  }

  public hasListeners(event: string): boolean {
    return this.eventSystem.hasListeners(event)
  }

  public getEventHistory(event?: string, limit?: number): FlowEvent[] {
    return this.eventSystem.getEventHistory(event, limit)
  }

  public clearEventHistory(): void {
    this.eventSystem.clearEventHistory()
  }

  public getEventStats(): {
    totalListeners: number
    eventTypes: number
    historySize: number
    maxHistorySize: number
  } {
    return this.eventSystem.getStats()
  }

  // Interaction system methods
  public get isDragging(): boolean {
    return this.interactionSystem.isDragging
  }

  public get isConnecting(): boolean {
    return this.interactionSystem.isConnecting
  }

  public getInteractionSelectedNodes(): FlowNode[] {
    return this.interactionSystem.getSelectedNodes()
  }

  public getInteractionSelectedEdges(): FlowEdge[] {
    return this.interactionSystem.getSelectedEdges()
  }

  public hasInteractionSelection(): boolean {
    return this.interactionSystem.hasSelection()
  }

  // Serialization
  public toJSON(options?: SerializationOptions): string {
    const nodes = this.getAllNodes()
    const edges = this.getAllEdges()
    const viewport = this.getViewport()

    return SerializationManager.serialize(nodes, edges, viewport, options)
  }

  public fromJSON(jsonString: string): void {
    const flowData = SerializationManager.deserialize(jsonString)

    // Clear existing data
    this.clearAll()

    // Load nodes first
    for (const nodeData of flowData.nodes) {
      this.addNode(nodeData)
    }

    // Load edges after nodes are created
    for (const edgeData of flowData.edges) {
      this.addEdge(edgeData)
    }

    // Set viewport
    this.setViewport(flowData.viewport)

    // Emit load event
    this.eventSystem.emit('flow:loaded', {
      type: 'flow:loaded',
      timestamp: Date.now(),
      data: {
        nodeCount: flowData.nodes.length,
        edgeCount: flowData.edges.length,
        viewport: flowData.viewport,
        metadata: flowData.metadata,
      },
    })
  }

  // Helper method to clear all data
  private clearAll(): void {
    // Clear selection first
    this.clearSelection()

    // Remove all edges first to avoid orphaned references
    const allEdges = this.getAllEdges()
    for (const edge of allEdges) {
      this.removeEdge(edge.id)
    }

    // Remove all nodes
    const allNodes = this.getAllNodes()
    for (const node of allNodes) {
      this.removeNode(node.id)
    }

    // Reset viewport
    this.viewportManager.resetZoom()
    this.viewportManager.centerView()
  }

  // Undo/Redo operations
  public undo(): boolean {
    return this.historySystem.undo()
  }

  public redo(): boolean {
    return this.historySystem.redo()
  }

  public canUndo(): boolean {
    return this.historySystem.canUndo()
  }

  public canRedo(): boolean {
    return this.historySystem.canRedo()
  }

  public clearHistory(): void {
    this.historySystem.clear()
  }

  public getHistoryStats(): {
    undoStackSize: number
    redoStackSize: number
    maxHistorySize: number
    canUndo: boolean
    canRedo: boolean
  } {
    return this.historySystem.getStats()
  }

  // Custom rendering methods
  public registerNodeRenderer(nodeType: string, renderer: any): void {
    this.nodeRenderer.registerRenderer(nodeType, renderer)
  }

  public unregisterNodeRenderer(nodeType: string): boolean {
    return this.nodeRenderer.unregisterRenderer(nodeType)
  }

  public registerEdgeRenderer(edgeType: string, renderer: any): void {
    this.edgeRenderer.registerRenderer(edgeType, renderer)
  }

  public unregisterEdgeRenderer(edgeType: string): boolean {
    return this.edgeRenderer.unregisterRenderer(edgeType)
  }

  // Performance optimization methods
  public updateVisibility(): {
    visibleNodes: FlowNode[]
    visibleEdges: FlowEdge[]
    hiddenNodes: FlowNode[]
    hiddenEdges: FlowEdge[]
  } {
    const viewport = this.getViewport()
    const containerBounds = {
      width: this._container.clientWidth,
      height: this._container.clientHeight,
    }

    return this.performanceSystem.updateVisibility(
      this.getAllNodes(),
      this.getAllEdges(),
      viewport,
      containerBounds
    )
  }

  public applyLevelOfDetail(): void {
    const viewport = this.getViewport()
    this.performanceSystem.applyLevelOfDetail(
      this.getAllNodes(),
      this.getAllEdges(),
      viewport.zoom
    )
  }

  public async batchOperation<T>(
    items: T[],
    operation: (item: T) => void,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    return this.performanceSystem.batchOperation(items, operation, onProgress)
  }

  public getPerformanceStats(): {
    virtualizationEnabled: boolean
    lodEnabled: boolean
    batchingEnabled: boolean
    cacheValid: boolean
    visibleNodeCount: number
    visibleEdgeCount: number
  } {
    return this.performanceSystem.getStats()
  }

  // Advanced rendering methods
  public renderNodeWithCustomRenderer(
    node: FlowNode,
    options?: {
      isSelected?: boolean
      isHovered?: boolean
      scale?: number
    }
  ): any {
    return this.nodeRenderer.renderNode(node, options)
  }

  public renderEdgeWithCustomRenderer(
    edge: FlowEdge,
    options?: {
      isSelected?: boolean
      isHovered?: boolean
      scale?: number
      pathType?: EdgePathType
    }
  ): any {
    return this.edgeRenderer.renderEdge(edge, options)
  }

  public generateEdgePath(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number },
    pathType: EdgePathType = 'bezier'
  ): string {
    return this.edgeRenderer.generatePath(sourcePos, targetPos, pathType)
  }

  // Cleanup method
  public destroy(): void {
    this.viewportManager.destroy()
    this.interactionSystem.destroy()
    this.eventSystem.destroy()
    this.historySystem.clear()
    this.performanceSystem.invalidateCache()

    // Destroy LeaferJS app
    if (this.leaferApp) {
      this.leaferApp.destroy()
      this.leaferApp = null
      this.contentLayer = null
      this.nodesGroup = null
      this.edgesGroup = null
      this.gridLayer = null
    }
  }
}
