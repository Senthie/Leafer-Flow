// NodeManager - manages node lifecycle and operations

import { FlowNode } from '../components/FlowNode'
import { NodeData, NodeTypeDefinition } from '../types'
import { FlowError, FlowErrorType } from '../errors/FlowError'
import { NodeEvent } from '../events/types'

export interface NodeManagerOptions {
  nodeTypes?: Record<string, NodeTypeDefinition> | undefined
  onEvent?: (event: NodeEvent) => void
}

export class NodeManager {
  private nodes: Map<string, FlowNode> = new Map()
  private nodeTypes: Map<string, NodeTypeDefinition> = new Map()
  private selectedNodes: Set<string> = new Set()
  private onEvent: ((event: NodeEvent) => void) | undefined

  constructor(options: NodeManagerOptions = {}) {
    this.onEvent = options.onEvent

    // Register default node types
    this.registerDefaultNodeTypes()

    // Register custom node types if provided
    if (options.nodeTypes) {
      Object.entries(options.nodeTypes).forEach(([type, definition]) => {
        this.registerNodeType(type, definition)
      })
    }
  }

  // Node type registration and validation
  public registerNodeType(type: string, definition: NodeTypeDefinition): void {
    if (!type || typeof type !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Node type must be a non-empty string',
        { type }
      )
    }

    if (!definition || typeof definition !== 'object') {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Node type definition must be an object',
        { type, definition }
      )
    }

    this.nodeTypes.set(type, definition)
  }

  public unregisterNodeType(type: string): boolean {
    return this.nodeTypes.delete(type)
  }

  public getNodeType(type: string): NodeTypeDefinition | null {
    return this.nodeTypes.get(type) || null
  }

  public getAllNodeTypes(): Record<string, NodeTypeDefinition> {
    const types: Record<string, NodeTypeDefinition> = {}
    this.nodeTypes.forEach((definition, type) => {
      types[type] = definition
    })
    return types
  }

  // Node CRUD operations
  public createNode(nodeData: NodeData): FlowNode {
    // Validate node data
    this.validateNodeData(nodeData)

    // Check if node with this ID already exists
    if (this.nodes.has(nodeData.id)) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        `Node with ID '${nodeData.id}' already exists`,
        { nodeId: nodeData.id }
      )
    }

    // Get node type definition
    const nodeTypeDef = this.nodeTypes.get(nodeData.type)
    if (!nodeTypeDef) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        `Unknown node type: ${nodeData.type}`,
        { nodeType: nodeData.type }
      )
    }

    // Merge default data with provided data
    const finalNodeData: NodeData = {
      ...nodeData,
      data: { ...nodeTypeDef.defaultData, ...nodeData.data },
      ports: nodeData.ports || nodeTypeDef.ports || [],
    }

    // Validate final data if validator exists
    if (nodeTypeDef.validate && !nodeTypeDef.validate(finalNodeData.data)) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        `Node data validation failed for type: ${nodeData.type}`,
        { nodeData: finalNodeData }
      )
    }

    // Create the node
    const node = new FlowNode(finalNodeData)
    this.nodes.set(nodeData.id, node)

    // Trigger creation event
    this.emitEvent({
      type: 'node:created',
      timestamp: Date.now(),
      data: {
        nodeId: nodeData.id,
        node: node,
      },
    })

    return node
  }

  public updateNode(nodeId: string, updates: Partial<NodeData>): FlowNode {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        `Node with ID '${nodeId}' not found`,
        { nodeId }
      )
    }

    // Store previous data for event
    const previousData = {
      position: node.position,
      data: { ...node.data },
    }

    // Update position if provided
    if (updates.position) {
      node.updatePosition(updates.position.x, updates.position.y)
    }

    // Update data if provided
    if (updates.data) {
      node.updateData(updates.data)
    }

    // Update ports if provided
    if (updates.ports) {
      // Remove existing ports
      const existingPortIds = Array.from(node.ports.keys())
      existingPortIds.forEach(portId => node.removePort(portId))

      // Add new ports
      updates.ports.forEach(portData => node.addPort(portData))
    }

    // Trigger update event
    this.emitEvent({
      type: 'node:updated',
      timestamp: Date.now(),
      data: {
        nodeId,
        node: node,
        previousData,
      },
    })

    return node
  }

  public deleteNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return false
    }

    // Remove from selection if selected
    this.selectedNodes.delete(nodeId)

    // Remove from nodes map
    const deleted = this.nodes.delete(nodeId)

    if (deleted) {
      // Trigger deletion event
      this.emitEvent({
        type: 'node:deleted',
        timestamp: Date.now(),
        data: {
          nodeId,
          node: node,
        },
      })
    }

    return deleted
  }

  public getNode(nodeId: string): FlowNode | null {
    return this.nodes.get(nodeId) || null
  }

  public getAllNodes(): FlowNode[] {
    return Array.from(this.nodes.values())
  }

  public getNodesByType(type: string): FlowNode[] {
    return this.getAllNodes().filter(node => node.type === type)
  }

  public hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId)
  }

  public getNodeCount(): number {
    return this.nodes.size
  }

  // Batch operations
  public createNodes(nodesData: NodeData[]): FlowNode[] {
    const createdNodes: FlowNode[] = []
    const errors: Array<{ nodeData: NodeData; error: Error }> = []

    for (const nodeData of nodesData) {
      try {
        const node = this.createNode(nodeData)
        createdNodes.push(node)
      } catch (error) {
        errors.push({ nodeData, error: error as Error })
      }
    }

    // If there were any errors, throw a batch error
    if (errors.length > 0) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        `Failed to create ${errors.length} out of ${nodesData.length} nodes`,
        { errors, createdNodes }
      )
    }

    return createdNodes
  }

  public updateNodes(
    updates: Array<{ nodeId: string; updates: Partial<NodeData> }>
  ): FlowNode[] {
    const updatedNodes: FlowNode[] = []
    const errors: Array<{ nodeId: string; error: Error }> = []

    for (const { nodeId, updates: nodeUpdates } of updates) {
      try {
        const node = this.updateNode(nodeId, nodeUpdates)
        updatedNodes.push(node)
      } catch (error) {
        errors.push({ nodeId, error: error as Error })
      }
    }

    // If there were any errors, throw a batch error
    if (errors.length > 0) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        `Failed to update ${errors.length} out of ${updates.length} nodes`,
        { errors, updatedNodes }
      )
    }

    return updatedNodes
  }

  public deleteNodes(nodeIds: string[]): string[] {
    const deletedNodeIds: string[] = []

    for (const nodeId of nodeIds) {
      if (this.deleteNode(nodeId)) {
        deletedNodeIds.push(nodeId)
      }
    }

    return deletedNodeIds
  }

  // Selection management
  public selectNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return false
    }

    if (!this.selectedNodes.has(nodeId)) {
      this.selectedNodes.add(nodeId)
      node.isSelected = true

      this.emitEvent({
        type: 'node:selected',
        timestamp: Date.now(),
        data: {
          nodeId,
          node: node,
        },
      })
    }

    return true
  }

  public deselectNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return false
    }

    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId)
      node.isSelected = false

      this.emitEvent({
        type: 'node:deselected',
        timestamp: Date.now(),
        data: {
          nodeId,
          node: node,
        },
      })
    }

    return true
  }

  public selectNodes(nodeIds: string[]): string[] {
    const selectedNodeIds: string[] = []

    for (const nodeId of nodeIds) {
      if (this.selectNode(nodeId)) {
        selectedNodeIds.push(nodeId)
      }
    }

    return selectedNodeIds
  }

  public deselectNodes(nodeIds: string[]): string[] {
    const deselectedNodeIds: string[] = []

    for (const nodeId of nodeIds) {
      if (this.deselectNode(nodeId)) {
        deselectedNodeIds.push(nodeId)
      }
    }

    return deselectedNodeIds
  }

  public clearSelection(): void {
    const selectedNodeIds = Array.from(this.selectedNodes)
    this.deselectNodes(selectedNodeIds)
  }

  public getSelectedNodes(): FlowNode[] {
    return Array.from(this.selectedNodes)
      .map(nodeId => this.nodes.get(nodeId))
      .filter((node): node is FlowNode => node !== undefined)
  }

  public getSelectedNodeIds(): string[] {
    return Array.from(this.selectedNodes)
  }

  public isNodeSelected(nodeId: string): boolean {
    return this.selectedNodes.has(nodeId)
  }

  // Utility methods
  public clear(): void {
    // Clear selection first
    this.clearSelection()

    // Delete all nodes (this will trigger events)
    const nodeIds = Array.from(this.nodes.keys())
    this.deleteNodes(nodeIds)
  }

  public getNodesInArea(area: {
    x: number
    y: number
    width: number
    height: number
  }): FlowNode[] {
    return this.getAllNodes().filter(node => {
      const nodePos = node.position
      const nodeDims = node.getDimensions()

      return (
        nodePos.x < area.x + area.width &&
        nodePos.x + nodeDims.width > area.x &&
        nodePos.y < area.y + area.height &&
        nodePos.y + nodeDims.height > area.y
      )
    })
  }

  // Private methods
  private validateNodeData(nodeData: NodeData): void {
    if (!nodeData) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Node data is required',
        { nodeData }
      )
    }

    if (!nodeData.id || typeof nodeData.id !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Node ID must be a non-empty string',
        { nodeData }
      )
    }

    if (!nodeData.type || typeof nodeData.type !== 'string') {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Node type must be a non-empty string',
        { nodeData }
      )
    }

    if (
      !nodeData.position ||
      typeof nodeData.position.x !== 'number' ||
      typeof nodeData.position.y !== 'number'
    ) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Node position must have numeric x and y coordinates',
        { nodeData }
      )
    }

    // Validate ports if provided
    if (nodeData.ports) {
      if (!Array.isArray(nodeData.ports)) {
        throw new FlowError(
          FlowErrorType.INVALID_NODE_DATA,
          'Node ports must be an array',
          { nodeData }
        )
      }

      nodeData.ports.forEach((port, index) => {
        if (!port.id || typeof port.id !== 'string') {
          throw new FlowError(
            FlowErrorType.INVALID_NODE_DATA,
            `Port at index ${index} must have a non-empty string ID`,
            { nodeData, port }
          )
        }

        if (!port.type || !['input', 'output'].includes(port.type)) {
          throw new FlowError(
            FlowErrorType.INVALID_NODE_DATA,
            `Port at index ${index} must have type 'input' or 'output'`,
            { nodeData, port }
          )
        }

        if (
          port.position &&
          !['top', 'right', 'bottom', 'left'].includes(port.position)
        ) {
          throw new FlowError(
            FlowErrorType.INVALID_NODE_DATA,
            `Port at index ${index} position must be 'top', 'right', 'bottom', or 'left'`,
            { nodeData, port }
          )
        }
      })
    }
  }

  private registerDefaultNodeTypes(): void {
    // Register a basic default node type
    this.registerNodeType('default', {
      render: (node: FlowNode) => node, // Use the default FlowNode rendering
      defaultData: {
        label: 'Default Node',
      },
      validate: (data: any) => {
        return data && typeof data === 'object'
      },
    })
  }

  private emitEvent(event: NodeEvent): void {
    if (this.onEvent) {
      this.onEvent(event)
    }
  }
}
