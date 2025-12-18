// Main FlowEditor class - entry point for Leafer-Flow

import { FlowOptions, FlowData, NodeData, EdgeData } from '../types'
import { FlowNode } from '../components/FlowNode'
import { FlowEdge } from '../components/FlowEdge'
import { NodeManager } from '../managers/NodeManager'
import { EdgeManager } from '../managers/EdgeManager'
import { NodeEvent, EdgeEvent } from '../events/types'

export class FlowEditor {
  private _container: HTMLElement
  private _options: FlowOptions
  private nodeManager: NodeManager
  private edgeManager: EdgeManager

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

    this.initialize()
  }

  private initialize(): void {
    // Initialize LeaferJS and core systems
    // This will be implemented in later tasks
  }

  private handleNodeEvent(event: NodeEvent): void {
    // Handle node events from NodeManager
    // This can be extended to trigger custom events or update UI
    console.log('Node event:', event.type, event.data)

    // Handle node deletion - remove related edges
    if (event.type === 'node:deleted' && event.data.nodeId) {
      this.edgeManager.deleteEdgesByNode(event.data.nodeId)
    }

    // Future: emit events to external listeners
    // this.emit(event.type, event.data)
  }

  private handleEdgeEvent(event: EdgeEvent): void {
    // Handle edge events from EdgeManager
    // This can be extended to trigger custom events or update UI
    console.log('Edge event:', event.type, event.data)

    // Future: emit events to external listeners
    // this.emit(event.type, event.data)
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
  public zoomTo(_scale: number): void {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  public panTo(_x: number, _y: number): void {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  public fitView(): void {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  // Event system
  public on(_event: string, _callback: Function): void {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  public off(_event: string, _callback: Function): void {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  // Serialization
  public toJSON(): FlowData {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  public fromJSON(_data: FlowData): void {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }
}
