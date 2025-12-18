// FlowNode component - represents a node in the workflow

import { NodeData, PortData } from "../types"
import { FlowPort } from "./FlowPort"

export class FlowNode {
  public readonly id: string
  public readonly type: string
  public data: any
  public position: { x: number; y: number }
  public ports: Map<string, FlowPort> = new Map()

  constructor(nodeData: NodeData) {
    this.id = nodeData.id
    this.type = nodeData.type
    this.data = nodeData.data
    this.position = { ...nodeData.position }

    // Initialize ports if provided
    if (nodeData.ports) {
      nodeData.ports.forEach((portData) => {
        this.addPort(portData)
      })
    }
  }

  public addPort(portData: PortData): FlowPort {
    const port = new FlowPort(portData, this)
    this.ports.set(portData.id, port)
    return port
  }

  public removePort(portId: string): boolean {
    return this.ports.delete(portId)
  }

  public getPort(portId: string): FlowPort | null {
    return this.ports.get(portId) || null
  }

  public getAllPorts(): FlowPort[] {
    return Array.from(this.ports.values())
  }

  public updatePosition(x: number, y: number): void {
    this.position.x = x
    this.position.y = y
  }

  public updateData(newData: any): void {
    this.data = { ...this.data, ...newData }
  }
}
