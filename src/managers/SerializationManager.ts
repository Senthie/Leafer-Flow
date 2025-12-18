// SerializationManager - Handles workflow state serialization and deserialization

import { FlowData, NodeData, EdgeData, ViewportState } from '../types'
import { FlowError, FlowErrorType } from '../errors/FlowError'
import { FlowNode } from '../components/FlowNode'
import { FlowEdge } from '../components/FlowEdge'

export interface SerializationOptions {
  includeMetadata?: boolean
  version?: string
  prettyPrint?: boolean
}

export class SerializationManager {
  private static readonly CURRENT_VERSION = '1.0.0'
  private static readonly SUPPORTED_VERSIONS = ['1.0.0']

  /**
   * Serialize workflow state to JSON
   */
  public static serialize(
    nodes: FlowNode[],
    edges: FlowEdge[],
    viewport: ViewportState,
    options: SerializationOptions = {}
  ): string {
    try {
      const {
        includeMetadata = true,
        version = this.CURRENT_VERSION,
        prettyPrint = false,
      } = options

      // Convert nodes to NodeData
      const nodeDataArray: NodeData[] = nodes.map(node =>
        this.serializeNode(node)
      )

      // Convert edges to EdgeData
      const edgeDataArray: EdgeData[] = edges.map(edge =>
        this.serializeEdge(edge)
      )

      // Build FlowData object
      const flowData: FlowData = {
        nodes: nodeDataArray,
        edges: edgeDataArray,
        viewport: {
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        },
      }

      // Add metadata if requested
      if (includeMetadata) {
        const now = new Date().toISOString()
        flowData.metadata = {
          version,
          created: now,
          modified: now,
        }
      }

      // Validate the data before serialization
      this.validateFlowData(flowData)

      // Convert to JSON string
      return JSON.stringify(flowData, null, prettyPrint ? 2 : 0)
    } catch (error) {
      if (error instanceof FlowError) {
        throw error
      }
      throw new FlowError(
        FlowErrorType.SERIALIZATION_ERROR,
        `Failed to serialize workflow: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { originalError: error }
      )
    }
  }

  /**
   * Deserialize JSON to workflow state
   */
  public static deserialize(jsonString: string): FlowData {
    try {
      // Parse JSON
      let flowData: any
      try {
        flowData = JSON.parse(jsonString)
      } catch (parseError) {
        throw new FlowError(
          FlowErrorType.DESERIALIZATION_ERROR,
          'Invalid JSON format',
          { originalError: parseError }
        )
      }

      // Validate the parsed data
      this.validateFlowData(flowData)

      // Check version compatibility
      if (flowData.metadata?.version) {
        this.validateVersion(flowData.metadata.version)
      }

      // Return validated FlowData
      return flowData as FlowData
    } catch (error) {
      if (error instanceof FlowError) {
        throw error
      }
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Failed to deserialize workflow: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { originalError: error }
      )
    }
  }

  /**
   * Serialize a single node to NodeData
   */
  private static serializeNode(node: FlowNode): NodeData {
    const nodeData: NodeData = {
      id: node.id,
      type: node.type,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
      data: node.data,
    }

    // Include ports if they exist
    if (node.ports && node.ports.size > 0) {
      nodeData.ports = Array.from(node.ports.values()).map(port => {
        const portData: any = {
          id: port.id,
          type: port.type,
          position: port.position,
        }

        if (port.dataType !== undefined) {
          portData.dataType = port.dataType
        }

        if (port.multiple !== undefined) {
          portData.multiple = port.multiple
        }

        return portData
      })
    }

    return nodeData
  }

  /**
   * Serialize a single edge to EdgeData
   */
  private static serializeEdge(edge: FlowEdge): EdgeData {
    return {
      id: edge.id,
      source: edge.source.id,
      sourcePort: edge.sourcePort.id,
      target: edge.target.id,
      targetPort: edge.targetPort.id,
      data: edge.data,
    }
  }

  /**
   * Validate FlowData structure
   */
  private static validateFlowData(data: any): void {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Flow data must be an object',
        { receivedType: typeof data }
      )
    }

    // Validate nodes array
    if (!Array.isArray(data.nodes)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Flow data must contain a nodes array',
        { receivedType: typeof data.nodes }
      )
    }

    // Validate each node
    data.nodes.forEach((node: any, index: number) => {
      this.validateNodeData(node, index)
    })

    // Validate edges array
    if (!Array.isArray(data.edges)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Flow data must contain an edges array',
        { receivedType: typeof data.edges }
      )
    }

    // Validate each edge
    data.edges.forEach((edge: any, index: number) => {
      this.validateEdgeData(edge, index)
    })

    // Validate viewport
    if (!data.viewport || typeof data.viewport !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Flow data must contain a viewport object',
        { receivedType: typeof data.viewport }
      )
    }

    this.validateViewportData(data.viewport)

    // Validate metadata if present
    if (data.metadata !== undefined) {
      this.validateMetadata(data.metadata)
    }
  }

  /**
   * Validate NodeData structure
   */
  private static validateNodeData(node: any, index: number): void {
    if (!node || typeof node !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Node at index ${index} must be an object`,
        { index, receivedType: typeof node }
      )
    }

    // Validate required fields
    if (typeof node.id !== 'string' || node.id.trim() === '') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Node at index ${index} must have a non-empty string id`,
        { index, nodeId: node.id }
      )
    }

    if (typeof node.type !== 'string' || node.type.trim() === '') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Node at index ${index} must have a non-empty string type`,
        { index, nodeId: node.id }
      )
    }

    // Validate position
    if (!node.position || typeof node.position !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Node at index ${index} must have a position object`,
        { index, nodeId: node.id }
      )
    }

    if (typeof node.position.x !== 'number' || !isFinite(node.position.x)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Node at index ${index} position.x must be a finite number`,
        { index, nodeId: node.id, x: node.position.x }
      )
    }

    if (typeof node.position.y !== 'number' || !isFinite(node.position.y)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Node at index ${index} position.y must be a finite number`,
        { index, nodeId: node.id, y: node.position.y }
      )
    }

    // Validate ports if present
    if (node.ports !== undefined) {
      if (!Array.isArray(node.ports)) {
        throw new FlowError(
          FlowErrorType.DESERIALIZATION_ERROR,
          `Node at index ${index} ports must be an array`,
          { index, nodeId: node.id }
        )
      }

      node.ports.forEach((port: any, portIndex: number) => {
        this.validatePortData(port, index, portIndex, node.id)
      })
    }
  }

  /**
   * Validate PortData structure
   */
  private static validatePortData(
    port: any,
    nodeIndex: number,
    portIndex: number,
    nodeId: string
  ): void {
    if (!port || typeof port !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Port at index ${portIndex} in node ${nodeId} must be an object`,
        { nodeIndex, portIndex, nodeId }
      )
    }

    if (typeof port.id !== 'string' || port.id.trim() === '') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Port at index ${portIndex} in node ${nodeId} must have a non-empty string id`,
        { nodeIndex, portIndex, nodeId }
      )
    }

    if (port.type !== 'input' && port.type !== 'output') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Port at index ${portIndex} in node ${nodeId} must have type 'input' or 'output'`,
        { nodeIndex, portIndex, nodeId, portType: port.type }
      )
    }

    const validPositions = ['top', 'right', 'bottom', 'left']
    if (!validPositions.includes(port.position)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Port at index ${portIndex} in node ${nodeId} must have a valid position`,
        {
          nodeIndex,
          portIndex,
          nodeId,
          position: port.position,
          validPositions,
        }
      )
    }
  }

  /**
   * Validate EdgeData structure
   */
  private static validateEdgeData(edge: any, index: number): void {
    if (!edge || typeof edge !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Edge at index ${index} must be an object`,
        { index, receivedType: typeof edge }
      )
    }

    // Validate required fields
    const requiredFields = [
      'id',
      'source',
      'sourcePort',
      'target',
      'targetPort',
    ]
    for (const field of requiredFields) {
      if (typeof edge[field] !== 'string' || edge[field].trim() === '') {
        throw new FlowError(
          FlowErrorType.DESERIALIZATION_ERROR,
          `Edge at index ${index} must have a non-empty string ${field}`,
          { index, edgeId: edge.id, field }
        )
      }
    }
  }

  /**
   * Validate ViewportState structure
   */
  private static validateViewportData(viewport: any): void {
    if (typeof viewport.x !== 'number' || !isFinite(viewport.x)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Viewport x must be a finite number',
        { x: viewport.x }
      )
    }

    if (typeof viewport.y !== 'number' || !isFinite(viewport.y)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Viewport y must be a finite number',
        { y: viewport.y }
      )
    }

    if (
      typeof viewport.zoom !== 'number' ||
      !isFinite(viewport.zoom) ||
      viewport.zoom <= 0
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Viewport zoom must be a positive finite number',
        { zoom: viewport.zoom }
      )
    }
  }

  /**
   * Validate metadata structure
   */
  private static validateMetadata(metadata: any): void {
    if (!metadata || typeof metadata !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata must be an object',
        { receivedType: typeof metadata }
      )
    }

    if (
      metadata.version !== undefined &&
      typeof metadata.version !== 'string'
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata version must be a string',
        { version: metadata.version }
      )
    }

    if (
      metadata.created !== undefined &&
      typeof metadata.created !== 'string'
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata created must be a string',
        { created: metadata.created }
      )
    }

    if (
      metadata.modified !== undefined &&
      typeof metadata.modified !== 'string'
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata modified must be a string',
        { modified: metadata.modified }
      )
    }
  }

  /**
   * Validate version compatibility
   */
  private static validateVersion(version: string): void {
    if (!this.SUPPORTED_VERSIONS.includes(version)) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Unsupported version: ${version}`,
        {
          version,
          supportedVersions: this.SUPPORTED_VERSIONS,
        }
      )
    }
  }

  /**
   * Check if a string is valid JSON
   */
  public static isValidJSON(jsonString: string): boolean {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get current serialization version
   */
  public static getVersion(): string {
    return this.CURRENT_VERSION
  }

  /**
   * Get supported versions
   */
  public static getSupportedVersions(): string[] {
    return [...this.SUPPORTED_VERSIONS]
  }
}
