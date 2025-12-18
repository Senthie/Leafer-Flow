// EdgeManager - manages edge lifecycle and operations

import { FlowEdge } from '../components/FlowEdge'
import { FlowNode } from '../components/FlowNode'
import { FlowPort } from '../components/FlowPort'
import { EdgeData, EdgeTypeDefinition } from '../types'
import { FlowError, FlowErrorType } from '../errors/FlowError'
import { EdgeEvent } from '../events/types'

export interface EdgeManagerOptions {
  edgeTypes?: Record<string, EdgeTypeDefinition> | undefined
  onEvent?: (event: EdgeEvent) => void
}

export class EdgeManager {
  private edges: Map<string, FlowEdge> = new Map()
  private edgeTypes: Map<string, EdgeTypeDefinition> = new Map()
  private selectedEdges: Set<string> = new Set()
  private onEvent: ((event: EdgeEvent) => void) | undefined

  constructor(options: EdgeManagerOptions = {}) {
    this.onEvent = options.onEvent

    // Register default edge types
    this.registerDefaultEdgeTypes()

    // Register custom edge types if provided
    if (options.edgeTypes) {
      Object.entries(options.edgeTypes).forEach(([type, definition]) => {
        this.registerEdgeType(type, definition)
      })
    }
  }

  // Edge type registration and validation
  public registerEdgeType(type: string, definition: EdgeTypeDefinition): void {
    if (!type || typeof type !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge type must be a non-empty string',
        { type }
      )
    }

    if (!definition || typeof definition !== 'object') {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge type definition must be an object',
        { type, definition }
      )
    }

    this.edgeTypes.set(type, definition)
  }

  public unregisterEdgeType(type: string): boolean {
    return this.edgeTypes.delete(type)
  }

  public getEdgeType(type: string): EdgeTypeDefinition | null {
    return this.edgeTypes.get(type) || null
  }

  public getAllEdgeTypes(): Record<string, EdgeTypeDefinition> {
    const types: Record<string, EdgeTypeDefinition> = {}
    this.edgeTypes.forEach((definition, type) => {
      types[type] = definition
    })
    return types
  }

  // Edge CRUD operations
  public createEdge(
    edgeData: EdgeData,
    sourceNode: FlowNode,
    targetNode: FlowNode
  ): FlowEdge {
    // Validate edge data
    this.validateEdgeData(edgeData)

    // Check if edge with this ID already exists
    if (this.edges.has(edgeData.id)) {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        `Edge with ID '${edgeData.id}' already exists`,
        { edgeId: edgeData.id }
      )
    }

    // Get source and target ports
    const sourcePort = sourceNode.getPort(edgeData.sourcePort)
    const targetPort = targetNode.getPort(edgeData.targetPort)

    if (!sourcePort) {
      throw new FlowError(
        FlowErrorType.CONNECTION_VALIDATION_FAILED,
        `Source port '${edgeData.sourcePort}' not found on node '${edgeData.source}'`,
        { edgeData, sourceNodeId: edgeData.source }
      )
    }

    if (!targetPort) {
      throw new FlowError(
        FlowErrorType.CONNECTION_VALIDATION_FAILED,
        `Target port '${edgeData.targetPort}' not found on node '${edgeData.target}'`,
        { edgeData, targetNodeId: edgeData.target }
      )
    }

    // Validate connection compatibility
    this.validateConnection(sourcePort, targetPort, edgeData)

    // Handle single connection port logic
    this.handleSingleConnectionPorts(sourcePort, targetPort)

    // Create the edge
    const edge = new FlowEdge(
      edgeData,
      sourceNode,
      sourcePort,
      targetNode,
      targetPort
    )
    this.edges.set(edgeData.id, edge)

    // Trigger creation event
    this.emitEvent({
      type: 'edge:created',
      timestamp: Date.now(),
      data: {
        edgeId: edgeData.id,
        edge: edge,
      },
    })

    return edge
  }

  public updateEdge(edgeId: string, updates: Partial<EdgeData>): FlowEdge {
    const edge = this.edges.get(edgeId)
    if (!edge) {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        `Edge with ID '${edgeId}' not found`,
        { edgeId }
      )
    }

    // Store previous data for event
    const previousData = {
      edgeData: { ...edge.edgeData },
    }

    // Update edge data if provided
    if (updates.data) {
      edge.updateData(updates.data)
    }

    // Note: Changing source/target connections would require recreating the edge
    // This is intentionally not supported in update to maintain data integrity

    // Trigger update event
    this.emitEvent({
      type: 'edge:updated',
      timestamp: Date.now(),
      data: {
        edgeId,
        edge: edge,
        previousData,
      },
    })

    return edge
  }

  public deleteEdge(edgeId: string): boolean {
    const edge = this.edges.get(edgeId)
    if (!edge) {
      return false
    }

    // Remove from selection if selected
    this.selectedEdges.delete(edgeId)

    // Clean up port connections
    edge.destroy()

    // Remove from edges map
    const deleted = this.edges.delete(edgeId)

    if (deleted) {
      // Trigger deletion event
      this.emitEvent({
        type: 'edge:deleted',
        timestamp: Date.now(),
        data: {
          edgeId,
          edge: edge,
        },
      })
    }

    return deleted
  }

  public getEdge(edgeId: string): FlowEdge | null {
    return this.edges.get(edgeId) || null
  }

  public getAllEdges(): FlowEdge[] {
    return Array.from(this.edges.values())
  }

  public getEdgesByNode(nodeId: string): FlowEdge[] {
    return this.getAllEdges().filter(
      edge => edge.source.id === nodeId || edge.target.id === nodeId
    )
  }

  public getEdgesByPort(nodeId: string, portId: string): FlowEdge[] {
    return this.getAllEdges().filter(
      edge =>
        (edge.source.id === nodeId && edge.sourcePort.id === portId) ||
        (edge.target.id === nodeId && edge.targetPort.id === portId)
    )
  }

  public hasEdge(edgeId: string): boolean {
    return this.edges.has(edgeId)
  }

  public getEdgeCount(): number {
    return this.edges.size
  }

  // Connection validation methods
  public canConnect(
    sourceNode: FlowNode,
    sourcePortId: string,
    targetNode: FlowNode,
    targetPortId: string
  ): { canConnect: boolean; reason?: string } {
    // Get ports
    const sourcePort = sourceNode.getPort(sourcePortId)
    const targetPort = targetNode.getPort(targetPortId)

    if (!sourcePort) {
      return {
        canConnect: false,
        reason: `Source port '${sourcePortId}' not found`,
      }
    }

    if (!targetPort) {
      return {
        canConnect: false,
        reason: `Target port '${targetPortId}' not found`,
      }
    }

    // Check if ports can connect
    if (!sourcePort.canConnect(targetPort)) {
      return {
        canConnect: false,
        reason: 'Port types or data types are incompatible',
      }
    }

    // Check for existing connection if target port doesn't support multiple
    if (!targetPort.multiple && targetPort.hasConnections()) {
      return {
        canConnect: false,
        reason:
          'Target port already has a connection and does not support multiple connections',
      }
    }

    // Check for existing connection if source port doesn't support multiple
    if (!sourcePort.multiple && sourcePort.hasConnections()) {
      return {
        canConnect: false,
        reason:
          'Source port already has a connection and does not support multiple connections',
      }
    }

    // Check for duplicate connection
    const existingEdge = this.findEdgeBetweenPorts(
      sourceNode.id,
      sourcePortId,
      targetNode.id,
      targetPortId
    )
    if (existingEdge) {
      return {
        canConnect: false,
        reason: 'Connection already exists between these ports',
      }
    }

    return { canConnect: true }
  }

  public findEdgeBetweenPorts(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): FlowEdge | null {
    return (
      this.getAllEdges().find(
        edge =>
          edge.source.id === sourceNodeId &&
          edge.sourcePort.id === sourcePortId &&
          edge.target.id === targetNodeId &&
          edge.targetPort.id === targetPortId
      ) || null
    )
  }

  // Batch operations
  public createEdges(
    edgesData: Array<{
      edgeData: EdgeData
      sourceNode: FlowNode
      targetNode: FlowNode
    }>
  ): FlowEdge[] {
    const createdEdges: FlowEdge[] = []
    const errors: Array<{ edgeData: EdgeData; error: Error }> = []

    for (const { edgeData, sourceNode, targetNode } of edgesData) {
      try {
        const edge = this.createEdge(edgeData, sourceNode, targetNode)
        createdEdges.push(edge)
      } catch (error) {
        errors.push({ edgeData, error: error as Error })
      }
    }

    // If there were any errors, throw a batch error
    if (errors.length > 0) {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        `Failed to create ${errors.length} out of ${edgesData.length} edges`,
        { errors, createdEdges }
      )
    }

    return createdEdges
  }

  public deleteEdges(edgeIds: string[]): string[] {
    const deletedEdgeIds: string[] = []

    for (const edgeId of edgeIds) {
      if (this.deleteEdge(edgeId)) {
        deletedEdgeIds.push(edgeId)
      }
    }

    return deletedEdgeIds
  }

  public deleteEdgesByNode(nodeId: string): string[] {
    const edgesToDelete = this.getEdgesByNode(nodeId)
    const edgeIds = edgesToDelete.map(edge => edge.id)
    return this.deleteEdges(edgeIds)
  }

  // Selection management
  public selectEdge(edgeId: string): boolean {
    const edge = this.edges.get(edgeId)
    if (!edge) {
      return false
    }

    if (!this.selectedEdges.has(edgeId)) {
      this.selectedEdges.add(edgeId)
      edge.isSelected = true

      this.emitEvent({
        type: 'edge:selected',
        timestamp: Date.now(),
        data: {
          edgeId,
          edge: edge,
        },
      })
    }

    return true
  }

  public deselectEdge(edgeId: string): boolean {
    const edge = this.edges.get(edgeId)
    if (!edge) {
      return false
    }

    if (this.selectedEdges.has(edgeId)) {
      this.selectedEdges.delete(edgeId)
      edge.isSelected = false

      this.emitEvent({
        type: 'edge:deselected',
        timestamp: Date.now(),
        data: {
          edgeId,
          edge: edge,
        },
      })
    }

    return true
  }

  public selectEdges(edgeIds: string[]): string[] {
    const selectedEdgeIds: string[] = []

    for (const edgeId of edgeIds) {
      if (this.selectEdge(edgeId)) {
        selectedEdgeIds.push(edgeId)
      }
    }

    return selectedEdgeIds
  }

  public deselectEdges(edgeIds: string[]): string[] {
    const deselectedEdgeIds: string[] = []

    for (const edgeId of edgeIds) {
      if (this.deselectEdge(edgeId)) {
        deselectedEdgeIds.push(edgeId)
      }
    }

    return deselectedEdgeIds
  }

  public clearSelection(): void {
    const selectedEdgeIds = Array.from(this.selectedEdges)
    this.deselectEdges(selectedEdgeIds)
  }

  public getSelectedEdges(): FlowEdge[] {
    return Array.from(this.selectedEdges)
      .map(edgeId => this.edges.get(edgeId))
      .filter((edge): edge is FlowEdge => edge !== undefined)
  }

  public getSelectedEdgeIds(): string[] {
    return Array.from(this.selectedEdges)
  }

  public isEdgeSelected(edgeId: string): boolean {
    return this.selectedEdges.has(edgeId)
  }

  // Utility methods
  public clear(): void {
    // Clear selection first
    this.clearSelection()

    // Delete all edges (this will trigger events)
    const edgeIds = Array.from(this.edges.keys())
    this.deleteEdges(edgeIds)
  }

  public updateEdgePositions(): void {
    // Update all edge paths when nodes have moved
    this.getAllEdges().forEach(edge => {
      edge.updateForNodeMovement()
    })
  }

  // Private methods
  private validateEdgeData(edgeData: EdgeData): void {
    if (!edgeData) {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge data is required',
        { edgeData }
      )
    }

    if (!edgeData.id || typeof edgeData.id !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge ID must be a non-empty string',
        { edgeData }
      )
    }

    if (!edgeData.source || typeof edgeData.source !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge source must be a non-empty string',
        { edgeData }
      )
    }

    if (!edgeData.sourcePort || typeof edgeData.sourcePort !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge sourcePort must be a non-empty string',
        { edgeData }
      )
    }

    if (!edgeData.target || typeof edgeData.target !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge target must be a non-empty string',
        { edgeData }
      )
    }

    if (!edgeData.targetPort || typeof edgeData.targetPort !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_EDGE_DATA,
        'Edge targetPort must be a non-empty string',
        { edgeData }
      )
    }

    // Prevent self-connections
    if (edgeData.source === edgeData.target) {
      throw new FlowError(
        FlowErrorType.CONNECTION_VALIDATION_FAILED,
        'Cannot create connection from a node to itself',
        { edgeData }
      )
    }
  }

  private validateConnection(
    sourcePort: FlowPort,
    targetPort: FlowPort,
    edgeData: EdgeData
  ): void {
    // Check basic port compatibility
    if (!sourcePort.canConnect(targetPort)) {
      throw new FlowError(
        FlowErrorType.CONNECTION_VALIDATION_FAILED,
        'Ports are not compatible for connection',
        {
          edgeData,
          sourcePort: {
            id: sourcePort.id,
            type: sourcePort.type,
            dataType: sourcePort.dataType,
          },
          targetPort: {
            id: targetPort.id,
            type: targetPort.type,
            dataType: targetPort.dataType,
          },
        }
      )
    }

    // Check for duplicate connection
    const existingEdge = this.findEdgeBetweenPorts(
      edgeData.source,
      edgeData.sourcePort,
      edgeData.target,
      edgeData.targetPort
    )
    if (existingEdge) {
      throw new FlowError(
        FlowErrorType.CONNECTION_VALIDATION_FAILED,
        'Connection already exists between these ports',
        { edgeData, existingEdgeId: existingEdge.id }
      )
    }
  }

  private handleSingleConnectionPorts(
    sourcePort: FlowPort,
    targetPort: FlowPort
  ): void {
    // Handle single connection source port
    if (!sourcePort.multiple && sourcePort.hasConnections()) {
      const existingConnections = sourcePort.getConnections()
      existingConnections.forEach(edgeId => {
        this.deleteEdge(edgeId)
      })
    }

    // Handle single connection target port
    if (!targetPort.multiple && targetPort.hasConnections()) {
      const existingConnections = targetPort.getConnections()
      existingConnections.forEach(edgeId => {
        this.deleteEdge(edgeId)
      })
    }
  }

  private registerDefaultEdgeTypes(): void {
    // Register a basic default edge type
    this.registerEdgeType('default', {
      render: (edge: FlowEdge) => edge, // Use the default FlowEdge rendering
      style: {
        stroke: '#666666',
        strokeWidth: 2,
      },
      validate: (_data: any) => {
        return true // Accept any data for default type
      },
    })
  }

  private emitEvent(event: EdgeEvent): void {
    if (this.onEvent) {
      this.onEvent(event)
    }
  }
}
