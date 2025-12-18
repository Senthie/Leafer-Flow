// HistorySystem - manages undo/redo functionality

export interface HistoryAction {
  type:
    | 'node:create'
    | 'node:update'
    | 'node:delete'
    | 'edge:create'
    | 'edge:update'
    | 'edge:delete'
    | 'viewport:change'
    | 'batch'
  timestamp: number
  data: any
  undo: () => void
  redo: () => void
}

export interface HistorySystemOptions {
  maxHistorySize?: number
  enableLogging?: boolean
}

export class HistorySystem {
  private undoStack: HistoryAction[] = []
  private redoStack: HistoryAction[] = []
  private maxHistorySize: number
  private enableLogging: boolean
  private isUndoing: boolean = false
  private isRedoing: boolean = false

  constructor(options: HistorySystemOptions = {}) {
    this.maxHistorySize = options.maxHistorySize || 100
    this.enableLogging = options.enableLogging || false
  }

  // Record an action
  public recordAction(action: HistoryAction): void {
    // Don't record actions during undo/redo operations
    if (this.isUndoing || this.isRedoing) {
      return
    }

    // Add to undo stack
    this.undoStack.push(action)

    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }

    // Clear redo stack when new action is recorded
    this.redoStack = []

    if (this.enableLogging) {
      console.log('Action recorded:', action.type, action.data)
    }
  }

  // Undo the last action
  public undo(): boolean {
    if (this.undoStack.length === 0) {
      return false
    }

    const action = this.undoStack.pop()!
    this.isUndoing = true

    try {
      action.undo()
      this.redoStack.push(action)

      if (this.enableLogging) {
        console.log('Action undone:', action.type)
      }

      return true
    } catch (error) {
      console.error('Error during undo:', error)
      // Put the action back if undo failed
      this.undoStack.push(action)
      return false
    } finally {
      this.isUndoing = false
    }
  }

  // Redo the last undone action
  public redo(): boolean {
    if (this.redoStack.length === 0) {
      return false
    }

    const action = this.redoStack.pop()!
    this.isRedoing = true

    try {
      action.redo()
      this.undoStack.push(action)

      if (this.enableLogging) {
        console.log('Action redone:', action.type)
      }

      return true
    } catch (error) {
      console.error('Error during redo:', error)
      // Put the action back if redo failed
      this.redoStack.push(action)
      return false
    } finally {
      this.isRedoing = false
    }
  }

  // Check if undo is available
  public canUndo(): boolean {
    return this.undoStack.length > 0
  }

  // Check if redo is available
  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  // Get undo stack size
  public getUndoStackSize(): number {
    return this.undoStack.length
  }

  // Get redo stack size
  public getRedoStackSize(): number {
    return this.redoStack.length
  }

  // Clear all history
  public clear(): void {
    this.undoStack = []
    this.redoStack = []

    if (this.enableLogging) {
      console.log('History cleared')
    }
  }

  // Get history stats
  public getStats(): {
    undoStackSize: number
    redoStackSize: number
    maxHistorySize: number
    canUndo: boolean
    canRedo: boolean
  } {
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      maxHistorySize: this.maxHistorySize,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    }
  }

  // Check if currently performing undo/redo
  public isPerformingHistoryAction(): boolean {
    return this.isUndoing || this.isRedoing
  }
}
