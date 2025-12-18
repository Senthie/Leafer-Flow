// FlowEdge component - represents a connection between nodes

import { EdgeData, EdgeStyle } from "../types"
import { FlowNode } from "./FlowNode"
import { FlowPort } from "./FlowPort"

export class FlowEdge {
  public readonly id: string
  public readonly source: FlowNode
  public readonly sourcePort: FlowPort
  public readonly target: FlowNode
  public readonly targetPort: FlowPort
  public data?: any
  private style: EdgeStyle = {}

  constructor(
    edgeData: EdgeData,
    source: FlowNode,
    sourcePort: FlowPort,
    target: FlowNode,
    targetPort: FlowPort
  ) {
    this.id = edgeData.id
    this.source = source
    this.sourcePort = sourcePort
    this.target = target
    this.targetPort = targetPort
    this.data = edgeData.data
  }

  public updatePath(): void {
    // Implementation will be added when integrating with LeaferJS
    // This will calculate and update the visual path of the connection
  }

  public setStyle(style: EdgeStyle): void {
    this.style = { ...this.style, ...style }
    this.updatePath()
  }

  public getStyle(): EdgeStyle {
    return { ...this.style }
  }

  public updateData(newData: any): void {
    this.data = { ...this.data, ...newData }
  }
}
