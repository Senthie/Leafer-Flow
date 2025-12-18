// Main FlowEditor class - entry point for Leafer-Flow

import { FlowOptions, FlowData, NodeData, EdgeData } from '../types'
import { FlowNode } from '../components/FlowNode'
import { FlowEdge } from '../components/FlowEdge'
import { NodeManager } from '../managers/NodeManager'
import { NodeEvent } from '../events/types'

export class FlowEditor {
  private _container: HTMLElement
  private _options: FlowOptions
  private nodeManager: NodeManager
  private edges: Map<string, FlowEdge> = new Map()

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
  }

  // Edge operations
  public addEdge(_edgeData: EdgeData): FlowEdge {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  public removeEdge(_edgeId: string): boolean {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet')
  }

  public getEdge(edgeId: string): FlowEdge | null {
    return this.edges.get(edgeId) || null
  }

  public getAllEdges(): FlowEdge[] {
    return Array.from(this.edges.values())
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
