// FlowEdge component - represents a connection between nodes

import { Path } from 'leafer-ui'
import { EdgeData, EdgeStyle } from '../types'
import { FlowNode } from './FlowNode'
import { FlowPort } from './FlowPort'

export class FlowEdge extends Path {
  public readonly id: string
  public readonly source: FlowNode
  public readonly sourcePort: FlowPort
  public readonly target: FlowNode
  public readonly targetPort: FlowPort
  public edgeData?: any // Renamed to avoid conflict with Path.data
  private _isSelected: boolean = false
  private edgeStyle: EdgeStyle = {}

  // Default styling
  private static readonly DEFAULT_STYLE = {
    stroke: '#666666',
    strokeWidth: 2,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  private static readonly SELECTED_STYLE = {
    stroke: '#007acc',
    strokeWidth: 3,
  }

  constructor(
    edgeData: EdgeData,
    source: FlowNode,
    sourcePort: FlowPort,
    target: FlowNode,
    targetPort: FlowPort
  ) {
    super({
      ...FlowEdge.DEFAULT_STYLE,
    })

    this.id = edgeData.id
    this.source = source
    this.sourcePort = sourcePort
    this.target = target
    this.targetPort = targetPort
    this.edgeData = edgeData.data

    // Initialize the path
    this.updatePath()

    // Add connection references to ports
    this.sourcePort.addConnection(this.id)
    this.targetPort.addConnection(this.id)
  }

  public updatePath(): void {
    const sourcePos = this.sourcePort.getAbsolutePosition()
    const targetPos = this.targetPort.getAbsolutePosition()

    if (!sourcePos || !targetPos) {
      return
    }

    // Calculate control points for smooth bezier curve
    const controlPoints = this.calculateControlPoints(sourcePos, targetPos)

    // Create bezier curve path
    const pathData = `M ${sourcePos.x} ${sourcePos.y} C ${controlPoints.cp1.x} ${controlPoints.cp1.y}, ${controlPoints.cp2.x} ${controlPoints.cp2.y}, ${targetPos.x} ${targetPos.y}`

    this.path = pathData

    // Apply current style
    this.applyCurrentStyle()
  }

  private calculateControlPoints(
    source: { x: number; y: number },
    target: { x: number; y: number }
  ): {
    cp1: { x: number; y: number }
    cp2: { x: number; y: number }
  } {
    const dx = target.x - source.x
    const dy = target.y - source.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Control point offset based on distance and port positions
    const offset = Math.min(distance * 0.5, 100)

    // Determine control point directions based on port positions
    const sourceDirection = this.getPortDirection(this.sourcePort.position)
    const targetDirection = this.getPortDirection(this.targetPort.position)

    const cp1 = {
      x: source.x + sourceDirection.x * offset,
      y: source.y + sourceDirection.y * offset,
    }

    const cp2 = {
      x: target.x + targetDirection.x * offset,
      y: target.y + targetDirection.y * offset,
    }

    return { cp1, cp2 }
  }

  private getPortDirection(position: 'top' | 'right' | 'bottom' | 'left'): {
    x: number
    y: number
  } {
    switch (position) {
      case 'top':
        return { x: 0, y: -1 }
      case 'right':
        return { x: 1, y: 0 }
      case 'bottom':
        return { x: 0, y: 1 }
      case 'left':
        return { x: -1, y: 0 }
      default:
        return { x: 1, y: 0 }
    }
  }

  public setStyle(style: EdgeStyle): void {
    this.edgeStyle = { ...this.edgeStyle, ...style }
    this.applyCurrentStyle()
  }

  public getStyle(): EdgeStyle {
    return { ...this.edgeStyle }
  }

  private applyCurrentStyle(): void {
    const baseStyle = { ...FlowEdge.DEFAULT_STYLE, ...this.edgeStyle }

    if (this._isSelected) {
      Object.assign(baseStyle, FlowEdge.SELECTED_STYLE)
    }

    // Apply styles to the path
    Object.keys(baseStyle).forEach(key => {
      if (key in this) {
        ;(this as any)[key] = (baseStyle as any)[key]
      }
    })
  }

  // Selection state management
  public get isSelected(): boolean {
    return this._isSelected
  }

  public set isSelected(value: boolean) {
    if (this._isSelected !== value) {
      this._isSelected = value
      this.applyCurrentStyle()
    }
  }

  public updateData(newData: any): void {
    this.edgeData = { ...this.edgeData, ...newData }
  }

  // Update positions when nodes move
  public updateForNodeMovement(): void {
    this.updatePath()
  }

  // Get edge bounds for selection detection
  public getBounds(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const sourcePos = this.sourcePort.getAbsolutePosition()
    const targetPos = this.targetPort.getAbsolutePosition()

    if (!sourcePos || !targetPos) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const minX = Math.min(sourcePos.x, targetPos.x)
    const minY = Math.min(sourcePos.y, targetPos.y)
    const maxX = Math.max(sourcePos.x, targetPos.x)
    const maxY = Math.max(sourcePos.y, targetPos.y)

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  // Check if point is near the edge path (for selection)
  public isPointNearPath(
    point: { x: number; y: number },
    threshold: number = 10
  ): boolean {
    const sourcePos = this.sourcePort.getAbsolutePosition()
    const targetPos = this.targetPort.getAbsolutePosition()

    if (!sourcePos || !targetPos) {
      return false
    }

    // Simplified distance check - can be enhanced with proper bezier curve distance calculation
    const distanceToLine = this.pointToLineDistance(point, sourcePos, targetPos)

    return distanceToLine <= threshold
  }

  private pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D

    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B)
    }

    const param = dot / lenSq

    let xx: number, yy: number

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Cleanup method to remove connections from ports
  public destroy(): void {
    this.sourcePort.removeConnection(this.id)
    this.targetPort.removeConnection(this.id)
  }
}
