// Data validation functions for Leafer-Flow

import { NodeData, EdgeData, PortData, FlowData } from '../types'
import { FlowError, FlowErrorType } from '../errors/FlowError'

/**
 * Validates node data structure and content
 */
export function validateNodeData(nodeData: any): nodeData is NodeData {
  if (!nodeData || typeof nodeData !== 'object') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Node data must be an object',
      { provided: nodeData }
    )
  }

  if (!nodeData.id || typeof nodeData.id !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Node must have a valid string ID',
      { provided: nodeData.id }
    )
  }

  if (!nodeData.type || typeof nodeData.type !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Node must have a valid string type',
      { provided: nodeData.type }
    )
  }

  if (!nodeData.position || typeof nodeData.position !== 'object') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Node must have a valid position object',
      { provided: nodeData.position }
    )
  }

  if (
    typeof nodeData.position.x !== 'number' ||
    typeof nodeData.position.y !== 'number'
  ) {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Node position must have numeric x and y coordinates',
      { provided: nodeData.position }
    )
  }

  // Validate ports if provided
  if (nodeData.ports) {
    if (!Array.isArray(nodeData.ports)) {
      throw new FlowError(
        FlowErrorType.INVALID_NODE_DATA,
        'Node ports must be an array',
        { provided: nodeData.ports }
      )
    }

    nodeData.ports.forEach((port: any, index: number) => {
      try {
        validatePortData(port)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        throw new FlowError(
          FlowErrorType.INVALID_NODE_DATA,
          `Invalid port at index ${index}: ${errorMessage}`,
          { portIndex: index, port, originalError: error }
        )
      }
    })
  }

  return true
}

/**
 * Validates port data structure and content
 */
export function validatePortData(portData: any): portData is PortData {
  if (!portData || typeof portData !== 'object') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Port data must be an object',
      { provided: portData }
    )
  }

  if (!portData.id || typeof portData.id !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Port must have a valid string ID',
      { provided: portData.id }
    )
  }

  if (!portData.type || !['input', 'output'].includes(portData.type)) {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      "Port type must be 'input' or 'output'",
      { provided: portData.type }
    )
  }

  if (
    !portData.position ||
    !['top', 'right', 'bottom', 'left'].includes(portData.position)
  ) {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      "Port position must be 'top', 'right', 'bottom', or 'left'",
      { provided: portData.position }
    )
  }

  if (portData.dataType && typeof portData.dataType !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Port dataType must be a string if provided',
      { provided: portData.dataType }
    )
  }

  if (portData.multiple && typeof portData.multiple !== 'boolean') {
    throw new FlowError(
      FlowErrorType.INVALID_NODE_DATA,
      'Port multiple must be a boolean if provided',
      { provided: portData.multiple }
    )
  }

  return true
}

/**
 * Validates edge data structure and content
 */
export function validateEdgeData(edgeData: any): edgeData is EdgeData {
  if (!edgeData || typeof edgeData !== 'object') {
    throw new FlowError(
      FlowErrorType.INVALID_EDGE_DATA,
      'Edge data must be an object',
      { provided: edgeData }
    )
  }

  if (!edgeData.id || typeof edgeData.id !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_EDGE_DATA,
      'Edge must have a valid string ID',
      { provided: edgeData.id }
    )
  }

  if (!edgeData.source || typeof edgeData.source !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_EDGE_DATA,
      'Edge must have a valid source node ID',
      { provided: edgeData.source }
    )
  }

  if (!edgeData.sourcePort || typeof edgeData.sourcePort !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_EDGE_DATA,
      'Edge must have a valid source port ID',
      { provided: edgeData.sourcePort }
    )
  }

  if (!edgeData.target || typeof edgeData.target !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_EDGE_DATA,
      'Edge must have a valid target node ID',
      { provided: edgeData.target }
    )
  }

  if (!edgeData.targetPort || typeof edgeData.targetPort !== 'string') {
    throw new FlowError(
      FlowErrorType.INVALID_EDGE_DATA,
      'Edge must have a valid target port ID',
      { provided: edgeData.targetPort }
    )
  }

  return true
}

/**
 * Validates complete flow data structure
 */
export function validateFlowData(flowData: any): flowData is FlowData {
  if (!flowData || typeof flowData !== 'object') {
    throw new FlowError(
      FlowErrorType.DESERIALIZATION_ERROR,
      'Flow data must be an object',
      { provided: flowData }
    )
  }

  if (!Array.isArray(flowData.nodes)) {
    throw new FlowError(
      FlowErrorType.DESERIALIZATION_ERROR,
      'Flow data must contain a nodes array',
      { provided: flowData.nodes }
    )
  }

  if (!Array.isArray(flowData.edges)) {
    throw new FlowError(
      FlowErrorType.DESERIALIZATION_ERROR,
      'Flow data must contain an edges array',
      { provided: flowData.edges }
    )
  }

  // Validate each node
  flowData.nodes.forEach((node: any, index: number) => {
    try {
      validateNodeData(node)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Invalid node at index ${index}: ${errorMessage}`,
        { nodeIndex: index, node, originalError: error }
      )
    }
  })

  // Validate each edge
  flowData.edges.forEach((edge: any, index: number) => {
    try {
      validateEdgeData(edge)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        `Invalid edge at index ${index}: ${errorMessage}`,
        { edgeIndex: index, edge, originalError: error }
      )
    }
  })

  // Validate viewport if provided
  if (flowData.viewport) {
    if (typeof flowData.viewport !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Viewport must be an object',
        { provided: flowData.viewport }
      )
    }

    if (
      typeof flowData.viewport.x !== 'number' ||
      typeof flowData.viewport.y !== 'number' ||
      typeof flowData.viewport.zoom !== 'number'
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Viewport must have numeric x, y, and zoom properties',
        { provided: flowData.viewport }
      )
    }
  }

  // Validate metadata if provided
  if (flowData.metadata) {
    if (typeof flowData.metadata !== 'object') {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata must be an object',
        { provided: flowData.metadata }
      )
    }

    if (
      flowData.metadata.version &&
      typeof flowData.metadata.version !== 'string'
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata version must be a string',
        { provided: flowData.metadata.version }
      )
    }

    if (
      flowData.metadata.created &&
      typeof flowData.metadata.created !== 'string'
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata created must be a string',
        { provided: flowData.metadata.created }
      )
    }

    if (
      flowData.metadata.modified &&
      typeof flowData.metadata.modified !== 'string'
    ) {
      throw new FlowError(
        FlowErrorType.DESERIALIZATION_ERROR,
        'Metadata modified must be a string',
        { provided: flowData.metadata.modified }
      )
    }
  }

  return true
}

/**
 * Validates connection compatibility between two ports
 */
export function validateConnection(
  sourcePort: PortData,
  targetPort: PortData
): boolean {
  // Source must be output, target must be input
  if (sourcePort.type !== 'output') {
    throw new FlowError(
      FlowErrorType.CONNECTION_VALIDATION_FAILED,
      'Source port must be an output port',
      { sourcePort, targetPort }
    )
  }

  if (targetPort.type !== 'input') {
    throw new FlowError(
      FlowErrorType.CONNECTION_VALIDATION_FAILED,
      'Target port must be an input port',
      { sourcePort, targetPort }
    )
  }

  // Check data type compatibility if both ports have data types
  if (sourcePort.dataType && targetPort.dataType) {
    if (sourcePort.dataType !== targetPort.dataType) {
      throw new FlowError(
        FlowErrorType.CONNECTION_VALIDATION_FAILED,
        `Data type mismatch: source port expects ${sourcePort.dataType}, target port expects ${targetPort.dataType}`,
        { sourcePort, targetPort }
      )
    }
  }

  return true
}
