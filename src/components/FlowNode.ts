// FlowNode component - represents a node in the workflow

import { Group, Rect, Text } from 'leafer-ui'
import { NodeData, PortData } from '../types'
import { FlowPort } from './FlowPort'

export class FlowNode extends Group {
  public readonly id: string
  public readonly type: string
  public data: any
  public ports: Map<string, FlowPort> = new Map()

  // Visual components
  private background!: Rect
  private label!: Text
  private _isSelected: boolean = false

  // Default styling
  private static readonly DEFAULT_WIDTH = 120
  private static readonly DEFAULT_HEIGHT = 60
  private static readonly DEFAULT_STYLE = {
    fill: '#ffffff',
    stroke: '#cccccc',
    strokeWidth: 1,
    cornerRadius: 4,
  }
  private static readonly SELECTED_STYLE = {
    stroke: '#007acc',
    strokeWidth: 2,
  }

  constructor(nodeData: NodeData) {
    super()

    this.id = nodeData.id
    this.type = nodeData.type
    this.data = nodeData.data

    // Set position
    this.x = nodeData.position.x
    this.y = nodeData.position.y

    // Initialize visual components
    this.initializeVisuals()

    // Initialize ports if provided
    if (nodeData.ports) {
      nodeData.ports.forEach(portData => {
        this.addPort(portData)
      })
    }
  }

  private initializeVisuals(): void {
    // Create background rectangle
    this.background = new Rect({
      width: FlowNode.DEFAULT_WIDTH,
      height: FlowNode.DEFAULT_HEIGHT,
      ...FlowNode.DEFAULT_STYLE,
    })
    this.add(this.background)

    // Create label text
    this.label = new Text({
      text: this.data?.label || this.type,
      fontSize: 12,
      fill: '#333333',
      textAlign: 'center',
      verticalAlign: 'middle',
      x: FlowNode.DEFAULT_WIDTH / 2,
      y: FlowNode.DEFAULT_HEIGHT / 2,
    })
    this.add(this.label)
  }

  public addPort(portData: PortData): FlowPort {
    const port = new FlowPort(portData, this)
    this.ports.set(portData.id, port)

    // Add visual port representation
    this.renderPort(port)

    return port
  }

  public removePort(portId: string): boolean {
    const port = this.ports.get(portId)
    if (port) {
      // Remove visual representation
      const portVisual = this.children.find(
        child => child.tag === `port-${portId}`
      )
      if (portVisual) {
        this.remove(portVisual)
      }
    }
    return this.ports.delete(portId)
  }

  public getPort(portId: string): FlowPort | null {
    return this.ports.get(portId) || null
  }

  public getAllPorts(): FlowPort[] {
    return Array.from(this.ports.values())
  }

  public updatePosition(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  public updateData(newData: any): void {
    this.data = { ...this.data, ...newData }

    // Update label if it changed
    if (newData.label && this.label) {
      this.label.text = newData.label
    }
  }

  // Selection state management
  public get isSelected(): boolean {
    return this._isSelected
  }

  public set isSelected(value: boolean) {
    if (this._isSelected !== value) {
      this._isSelected = value
      this.updateSelectionVisuals()
    }
  }

  private updateSelectionVisuals(): void {
    if (this._isSelected) {
      this.background.stroke = FlowNode.SELECTED_STYLE.stroke
      this.background.strokeWidth = FlowNode.SELECTED_STYLE.strokeWidth
    } else {
      this.background.stroke = FlowNode.DEFAULT_STYLE.stroke
      this.background.strokeWidth = FlowNode.DEFAULT_STYLE.strokeWidth
    }
  }

  // Port rendering
  private renderPort(port: FlowPort): void {
    const portSize = 8
    const portVisual = new Rect({
      width: portSize,
      height: portSize,
      fill: port.type === 'input' ? '#4CAF50' : '#FF9800',
      stroke: '#333333',
      strokeWidth: 1,
      cornerRadius: portSize / 2,
      tag: `port-${port.id}`,
    })

    // Position port based on its configuration
    const portPosition = this.getPortPosition(port)
    portVisual.x = portPosition.x - portSize / 2
    portVisual.y = portPosition.y - portSize / 2

    this.add(portVisual)
  }

  private getPortPosition(port: FlowPort): { x: number; y: number } {
    const width = FlowNode.DEFAULT_WIDTH
    const height = FlowNode.DEFAULT_HEIGHT

    switch (port.position) {
      case 'top':
        return { x: width / 2, y: 0 }
      case 'right':
        return { x: width, y: height / 2 }
      case 'bottom':
        return { x: width / 2, y: height }
      case 'left':
        return { x: 0, y: height / 2 }
      default:
        return { x: width / 2, y: height / 2 }
    }
  }

  // Get absolute position for port connections
  public getPortAbsolutePosition(
    portId: string
  ): { x: number; y: number } | null {
    const port = this.getPort(portId)
    if (!port) return null

    const localPos = this.getPortPosition(port)
    return {
      x: (this.x || 0) + localPos.x,
      y: (this.y || 0) + localPos.y,
    }
  }

  // Get node dimensions
  public getDimensions(): { width: number; height: number } {
    return {
      width: FlowNode.DEFAULT_WIDTH,
      height: FlowNode.DEFAULT_HEIGHT,
    }
  }

  // Legacy position property for compatibility
  public get position(): { x: number; y: number } {
    return { x: this.x || 0, y: this.y || 0 }
  }
}
