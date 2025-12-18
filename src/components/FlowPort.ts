// FlowPort component - represents connection points on nodes

import { PortData } from '../types'
import type { FlowNode } from './FlowNode'

export class FlowPort {
  public readonly id: string
  public readonly type: 'input' | 'output'
  public readonly dataType: string | undefined
  public readonly multiple: boolean
  public readonly position: 'top' | 'right' | 'bottom' | 'left'
  public readonly parentNode: FlowNode
  private connections: Set<string> = new Set() // Edge IDs connected to this port

  constructor(portData: PortData, parentNode: FlowNode) {
    this.id = portData.id
    this.type = portData.type
    this.dataType = portData.dataType
    this.multiple = portData.multiple ?? false
    this.position = portData.position
    this.parentNode = parentNode
  }

  public addConnection(edgeId: string): boolean {
    // If port doesn't support multiple connections, remove existing ones
    if (!this.multiple && this.connections.size > 0) {
      this.connections.clear()
    }

    this.connections.add(edgeId)
    return true
  }

  public removeConnection(edgeId: string): boolean {
    return this.connections.delete(edgeId)
  }

  public getConnections(): string[] {
    return Array.from(this.connections)
  }

  public hasConnections(): boolean {
    return this.connections.size > 0
  }

  public canConnect(targetPort: FlowPort): boolean {
    // Basic connection validation
    if (this.type === targetPort.type) {
      return false // Can't connect same type ports
    }

    // Check data type compatibility if specified
    if (this.dataType && targetPort.dataType) {
      return this.dataType === targetPort.dataType
    }

    return true
  }

  public getAbsolutePosition(): { x: number; y: number } {
    // This will be implemented when integrating with LeaferJS rendering
    // For now, return relative position based on parent node
    const nodePos = this.parentNode.position

    // Simple offset calculation based on position
    const offset = this.getPositionOffset()
    return {
      x: nodePos.x + offset.x,
      y: nodePos.y + offset.y,
    }
  }

  private getPositionOffset(): { x: number; y: number } {
    // Default offsets - will be refined with actual node dimensions
    const offsets = {
      top: { x: 0, y: -20 },
      right: { x: 50, y: 0 },
      bottom: { x: 0, y: 20 },
      left: { x: -50, y: 0 },
    }

    return offsets[this.position]
  }
}
