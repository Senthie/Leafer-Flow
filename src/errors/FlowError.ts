// Error handling for Leafer-Flow

export enum FlowErrorType {
  INVALID_NODE_DATA = "INVALID_NODE_DATA",
  INVALID_EDGE_DATA = "INVALID_EDGE_DATA",
  CONNECTION_VALIDATION_FAILED = "CONNECTION_VALIDATION_FAILED",
  SERIALIZATION_ERROR = "SERIALIZATION_ERROR",
  DESERIALIZATION_ERROR = "DESERIALIZATION_ERROR",
  RENDER_ERROR = "RENDER_ERROR",
}

export class FlowError extends Error {
  public readonly type: FlowErrorType
  public readonly details: any

  constructor(type: FlowErrorType, message: string, details?: any) {
    super(message)
    this.name = "FlowError"
    this.type = type
    this.details = details

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FlowError)
    }
  }
}
