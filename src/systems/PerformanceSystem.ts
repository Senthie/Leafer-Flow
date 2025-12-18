// PerformanceSystem - optimizes rendering for large node counts

import { FlowNode } from '../components/FlowNode'
import { FlowEdge } from '../components/FlowEdge'
import { ViewportState } from '../types'

export interface PerformanceSystemOptions {
  enableVirtualization?: boolean
  viewportPadding?: number
  maxVisibleNodes?: number
  maxVisibleEdges?: number
  enableLevelOfDetail?: boolean
  lodThreshold?: number
  enableBatching?: boolean
  batchSize?: number
}

export interface ViewportBounds {
  x: number
  y: number
  width: number
  height: number
}

export class PerformanceSystem {
  private enableVirtualization: boolean
  private viewportPadding: number
  private maxVisibleNodes: number
  private maxVisibleEdges: number
  private enableLevelOfDetail: boolean
  private lodThreshold: number
  private enableBatching: boolean
  private batchSize: number

  // Caching
  private visibleNodesCache: Set<string> = new Set()
  private visibleEdgesCache: Set<string> = new Set()
  private lastViewport: ViewportState | null = null
  private cacheValid: boolean = false

  constructor(options: PerformanceSystemOptions = {}) {
    this.enableVirtualization = options.enableVirtualization ?? true
    this.viewportPadding = options.viewportPadding ?? 100
    this.maxVisibleNodes = options.maxVisibleNodes ?? 1000
    this.maxVisibleEdges = options.maxVisibleEdges ?? 2000
    this.enableLevelOfDetail = options.enableLevelOfDetail ?? true
    this.lodThreshold = options.lodThreshold ?? 0.5
    this.enableBatching = options.enableBatching ?? true
    this.batchSize = options.batchSize ?? 50
  }

  // Update visible elements based on viewport
  public updateVisibility(
    nodes: FlowNode[],
    edges: FlowEdge[],
    viewport: ViewportState,
    containerBounds: { width: number; height: number }
  ): {
    visibleNodes: FlowNode[]
    visibleEdges: FlowEdge[]
    hiddenNodes: FlowNode[]
    hiddenEdges: FlowEdge[]
  } {
    // Check if we need to recalculate
    if (
      this.cacheValid &&
      this.lastViewport &&
      this.viewportsEqual(viewport, this.lastViewport)
    ) {
      return this.getCachedResults(nodes, edges)
    }

    const viewportBounds = this.calculateViewportBounds(
      viewport,
      containerBounds
    )

    // Calculate visible nodes
    const visibleNodes = this.enableVirtualization
      ? this.getVisibleNodes(nodes, viewportBounds)
      : nodes

    // Calculate visible edges (only edges connected to visible nodes)
    const visibleEdges = this.enableVirtualization
      ? this.getVisibleEdges(edges, visibleNodes)
      : edges

    // Apply limits
    const limitedVisibleNodes = this.applyNodeLimit(visibleNodes)
    const limitedVisibleEdges = this.applyEdgeLimit(visibleEdges)

    // Update cache
    this.updateCache(limitedVisibleNodes, limitedVisibleEdges, viewport)

    return {
      visibleNodes: limitedVisibleNodes,
      visibleEdges: limitedVisibleEdges,
      hiddenNodes: nodes.filter(node => !limitedVisibleNodes.includes(node)),
      hiddenEdges: edges.filter(edge => !limitedVisibleEdges.includes(edge)),
    }
  }

  // Apply level of detail based on zoom level
  public applyLevelOfDetail(
    nodes: FlowNode[],
    edges: FlowEdge[],
    zoomLevel: number
  ): void {
    if (!this.enableLevelOfDetail) {
      return
    }

    const isLowDetail = zoomLevel < this.lodThreshold

    // Apply LOD to nodes
    nodes.forEach(node => {
      this.applyNodeLOD(node, isLowDetail)
    })

    // Apply LOD to edges
    edges.forEach(edge => {
      this.applyEdgeLOD(edge, isLowDetail)
    })
  }

  // Batch operations for better performance
  public batchOperation<T>(
    items: T[],
    operation: (item: T) => void,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    if (!this.enableBatching) {
      items.forEach(operation)
      return Promise.resolve()
    }

    return new Promise(resolve => {
      let index = 0

      const processBatch = () => {
        const endIndex = Math.min(index + this.batchSize, items.length)

        for (let i = index; i < endIndex; i++) {
          operation(items[i])
        }

        index = endIndex

        if (onProgress) {
          onProgress(index, items.length)
        }

        if (index < items.length) {
          // Use requestAnimationFrame for smooth processing
          requestAnimationFrame(processBatch)
        } else {
          resolve()
        }
      }

      processBatch()
    })
  }

  // Invalidate cache when nodes/edges change
  public invalidateCache(): void {
    this.cacheValid = false
    this.visibleNodesCache.clear()
    this.visibleEdgesCache.clear()
  }

  // Get performance stats
  public getStats(): {
    virtualizationEnabled: boolean
    lodEnabled: boolean
    batchingEnabled: boolean
    cacheValid: boolean
    visibleNodeCount: number
    visibleEdgeCount: number
  } {
    return {
      virtualizationEnabled: this.enableVirtualization,
      lodEnabled: this.enableLevelOfDetail,
      batchingEnabled: this.enableBatching,
      cacheValid: this.cacheValid,
      visibleNodeCount: this.visibleNodesCache.size,
      visibleEdgeCount: this.visibleEdgesCache.size,
    }
  }

  // Private methods
  private calculateViewportBounds(
    viewport: ViewportState,
    containerBounds: { width: number; height: number }
  ): ViewportBounds {
    const scale = viewport.zoom
    const padding = this.viewportPadding

    return {
      x: -viewport.x / scale - padding,
      y: -viewport.y / scale - padding,
      width: containerBounds.width / scale + padding * 2,
      height: containerBounds.height / scale + padding * 2,
    }
  }

  private getVisibleNodes(
    nodes: FlowNode[],
    viewportBounds: ViewportBounds
  ): FlowNode[] {
    return nodes.filter(node => {
      const nodePos = node.position
      const nodeDims = node.getDimensions()

      return this.intersects(
        nodePos.x,
        nodePos.y,
        nodeDims.width,
        nodeDims.height,
        viewportBounds
      )
    })
  }

  private getVisibleEdges(
    edges: FlowEdge[],
    visibleNodes: FlowNode[]
  ): FlowEdge[] {
    const visibleNodeIds = new Set(visibleNodes.map(node => node.id))

    return edges.filter(edge => {
      // Edge is visible if both source and target nodes are visible
      return (
        visibleNodeIds.has(edge.source.id) && visibleNodeIds.has(edge.target.id)
      )
    })
  }

  private intersects(
    x: number,
    y: number,
    width: number,
    height: number,
    bounds: ViewportBounds
  ): boolean {
    return (
      x < bounds.x + bounds.width &&
      x + width > bounds.x &&
      y < bounds.y + bounds.height &&
      y + height > bounds.y
    )
  }

  private applyNodeLimit(nodes: FlowNode[]): FlowNode[] {
    if (nodes.length <= this.maxVisibleNodes) {
      return nodes
    }

    // Sort by distance from viewport center and take closest nodes
    // For now, just take the first N nodes - can be enhanced with spatial sorting
    return nodes.slice(0, this.maxVisibleNodes)
  }

  private applyEdgeLimit(edges: FlowEdge[]): FlowEdge[] {
    if (edges.length <= this.maxVisibleEdges) {
      return edges
    }

    // Take the first N edges - can be enhanced with priority sorting
    return edges.slice(0, this.maxVisibleEdges)
  }

  private applyNodeLOD(node: FlowNode, isLowDetail: boolean): void {
    // In low detail mode, hide complex node elements
    // This is a simplified implementation - can be enhanced based on node structure
    if (isLowDetail) {
      // Hide detailed elements, show only basic shape
      node.opacity = 0.8
    } else {
      // Show full detail
      node.opacity = 1.0
    }
  }

  private applyEdgeLOD(edge: FlowEdge, isLowDetail: boolean): void {
    // In low detail mode, use simpler edge rendering
    if (isLowDetail) {
      const currentWidth = (edge as any).strokeWidth || 2
      ;(edge as any).strokeWidth = Math.max(1, currentWidth * 0.5)
      edge.opacity = 0.6
    } else {
      // Restore original styling - this would need to be enhanced to store original values
      edge.opacity = 1.0
    }
  }

  private viewportsEqual(a: ViewportState, b: ViewportState): boolean {
    const threshold = 0.001
    return (
      Math.abs(a.x - b.x) < threshold &&
      Math.abs(a.y - b.y) < threshold &&
      Math.abs(a.zoom - b.zoom) < threshold
    )
  }

  private updateCache(
    visibleNodes: FlowNode[],
    visibleEdges: FlowEdge[],
    viewport: ViewportState
  ): void {
    this.visibleNodesCache = new Set(visibleNodes.map(node => node.id))
    this.visibleEdgesCache = new Set(visibleEdges.map(edge => edge.id))
    this.lastViewport = { ...viewport }
    this.cacheValid = true
  }

  private getCachedResults(
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): {
    visibleNodes: FlowNode[]
    visibleEdges: FlowEdge[]
    hiddenNodes: FlowNode[]
    hiddenEdges: FlowEdge[]
  } {
    const visibleNodes = allNodes.filter(node =>
      this.visibleNodesCache.has(node.id)
    )
    const visibleEdges = allEdges.filter(edge =>
      this.visibleEdgesCache.has(edge.id)
    )

    return {
      visibleNodes,
      visibleEdges,
      hiddenNodes: allNodes.filter(
        node => !this.visibleNodesCache.has(node.id)
      ),
      hiddenEdges: allEdges.filter(
        edge => !this.visibleEdgesCache.has(edge.id)
      ),
    }
  }
}
