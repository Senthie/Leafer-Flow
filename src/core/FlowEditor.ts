// Main FlowEditor class - entry point for Leafer-Flow

import { FlowOptions, NodeData, EdgeData } from '../types'
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
    }

    // Initialize EventSystem first
    this.eventSystem = new EventSystem({
      maxListeners: 1000,
      enableLogging: false, // Can be made configurable
    })

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
    // Initialize LeaferJS and core systems
    // This will be implemented in later tasks

    // Initialize viewport manager with container
    this.viewportManager.initialize(this._container)

    // Initialize interaction system with container
    this.interactionSystem.initialize(this._container)
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
    return this.nodeManager.createNode(nodeData)
  }

  public removeNode(nodeId: string): boolean {
    return this.nodeManager.deleteNode(nodeId)
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

    return this.edgeManager.createEdge(edgeData, sourceNode, targetNode)
  }

  public removeEdge(edgeId: string): boolean {
    return this.edgeManager.deleteEdge(edgeId)
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

  // Cleanup method
  public destroy(): void {
    this.viewportManager.destroy()
    this.interactionSystem.destroy()
    this.eventSystem.destroy()
  }
}
