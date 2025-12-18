// Core data interfaces for Leafer-Flow

export interface FlowData {
  nodes: NodeData[]
  edges: EdgeData[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  metadata?: {
    version: string
    created: string
    modified: string
  }
}

export interface NodeData {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
  ports?: PortData[]
}

export interface EdgeData {
  id: string
  source: string
  sourcePort: string
  target: string
  targetPort: string
  data?: any
}

export interface PortData {
  id: string
  type: "input" | "output"
  dataType?: string
  multiple?: boolean
  position: "top" | "right" | "bottom" | "left"
}

export interface FlowOptions {
  container: HTMLElement
  width?: number
  height?: number
  background?: string
  grid?: boolean
  minimap?: boolean
  controls?: boolean
  nodeTypes?: Record<string, NodeTypeDefinition>
  edgeTypes?: Record<string, EdgeTypeDefinition>
}

export interface NodeTypeDefinition {
  render: (node: any) => any // Will be properly typed with LeaferJS types later
  ports?: PortData[]
  defaultData?: any
  validate?: (data: any) => boolean
}

export interface EdgeTypeDefinition {
  render: (edge: any) => any // Will be properly typed with LeaferJS types later
  style?: any
  validate?: (data: any) => boolean
}

export interface EdgeStyle {
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  fill?: string
}
