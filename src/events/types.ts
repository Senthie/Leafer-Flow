// Event system types for Leafer-Flow

export interface FlowEvent {
  type: string
  timestamp: number
  data: any
}

export interface NodeEvent extends FlowEvent {
  type:
    | "node:created"
    | "node:updated"
    | "node:deleted"
    | "node:selected"
    | "node:deselected"
  data: {
    nodeId: string
    node?: any
    previousData?: any
  }
}

export interface EdgeEvent extends FlowEvent {
  type:
    | "edge:created"
    | "edge:updated"
    | "edge:deleted"
    | "edge:selected"
    | "edge:deselected"
  data: {
    edgeId: string
    edge?: any
    previousData?: any
  }
}

export interface InteractionEvent extends FlowEvent {
  type:
    | "drag:start"
    | "drag:move"
    | "drag:end"
    | "connection:start"
    | "connection:end"
  data: {
    elementId?: string
    position?: { x: number; y: number }
    delta?: { x: number; y: number }
  }
}

export interface ViewportEvent extends FlowEvent {
  type: "viewport:zoom" | "viewport:pan"
  data: {
    zoom?: number
    position?: { x: number; y: number }
    previousZoom?: number
    previousPosition?: { x: number; y: number }
  }
}
