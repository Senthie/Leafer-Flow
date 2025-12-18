// EdgeRenderer - advanced custom edge rendering system

import { Path, Group, Polygon, Rect } from 'leafer-ui'
import { FlowEdge } from '../components/FlowEdge'
import { EdgeStyle } from '../types'

export interface EdgeRenderContext {
  edge: FlowEdge
  isSelected: boolean
  isHovered: boolean
  scale: number
  theme: EdgeTheme
}

export interface EdgeTheme {
  colors: {
    default: string
    selected: string
    hovered: string
    arrow: string
  }
  sizes: {
    strokeWidth: number
    selectedStrokeWidth: number
    arrowSize: number
  }
  styles: {
    strokeLinecap: 'butt' | 'round' | 'square'
    strokeLinejoin: 'miter' | 'round' | 'bevel'
  }
}

export interface CustomEdgeRenderer {
  render(context: EdgeRenderContext): Group
  update?(context: EdgeRenderContext, existingGroup: Group): void
  getStyle?(data: any): EdgeStyle
}

export type EdgePathType = 'bezier' | 'straight' | 'orthogonal' | 'smooth-step'

export class EdgeRenderer {
  private customRenderers: Map<string, CustomEdgeRenderer> = new Map()
  private defaultTheme: EdgeTheme

  constructor() {
    this.defaultTheme = this.createDefaultTheme()
    this.registerBuiltInRenderers()
  }

  // Register a custom renderer for an edge type
  public registerRenderer(
    edgeType: string,
    renderer: CustomEdgeRenderer
  ): void {
    this.customRenderers.set(edgeType, renderer)
  }

  // Unregister a custom renderer
  public unregisterRenderer(edgeType: string): boolean {
    return this.customRenderers.delete(edgeType)
  }

  // Render an edge using the appropriate renderer
  public renderEdge(
    edge: FlowEdge,
    options: {
      isSelected?: boolean
      isHovered?: boolean
      scale?: number
      theme?: Partial<EdgeTheme>
      pathType?: EdgePathType
    } = {}
  ): Group {
    const context: EdgeRenderContext = {
      edge,
      isSelected: options.isSelected || false,
      isHovered: options.isHovered || false,
      scale: options.scale || 1.0,
      theme: this.mergeTheme(options.theme),
    }

    const edgeType = edge.edgeData?.type || 'default'
    const renderer = this.customRenderers.get(edgeType)
    if (renderer) {
      return renderer.render(context)
    }

    // Fall back to default renderer
    return this.renderDefaultEdge(context, options.pathType || 'bezier')
  }

  // Update an existing rendered edge
  public updateEdge(
    edge: FlowEdge,
    existingGroup: Group,
    options: {
      isSelected?: boolean
      isHovered?: boolean
      scale?: number
      theme?: Partial<EdgeTheme>
      pathType?: EdgePathType
    } = {}
  ): void {
    const context: EdgeRenderContext = {
      edge,
      isSelected: options.isSelected || false,
      isHovered: options.isHovered || false,
      scale: options.scale || 1.0,
      theme: this.mergeTheme(options.theme),
    }

    const edgeType = edge.edgeData?.type || 'default'
    const renderer = this.customRenderers.get(edgeType)
    if (renderer && renderer.update) {
      renderer.update(context, existingGroup)
      return
    }

    // Fall back to re-rendering
    const newGroup = this.renderEdge(edge, options)
    existingGroup.removeAll()
    newGroup.children.forEach(child => existingGroup.add(child))
  }

  // Generate path data for different path types
  public generatePath(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number },
    pathType: EdgePathType = 'bezier',
    sourceDirection?: { x: number; y: number },
    targetDirection?: { x: number; y: number }
  ): string {
    switch (pathType) {
      case 'straight':
        return this.generateStraightPath(sourcePos, targetPos)
      case 'orthogonal':
        return this.generateOrthogonalPath(sourcePos, targetPos)
      case 'smooth-step':
        return this.generateSmoothStepPath(sourcePos, targetPos)
      case 'bezier':
      default:
        return this.generateBezierPath(
          sourcePos,
          targetPos,
          sourceDirection,
          targetDirection
        )
    }
  }

  // Private methods
  private createDefaultTheme(): EdgeTheme {
    return {
      colors: {
        default: '#666666',
        selected: '#007acc',
        hovered: '#0099ff',
        arrow: '#333333',
      },
      sizes: {
        strokeWidth: 2,
        selectedStrokeWidth: 3,
        arrowSize: 8,
      },
      styles: {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    }
  }

  private mergeTheme(partialTheme?: Partial<EdgeTheme>): EdgeTheme {
    if (!partialTheme) {
      return this.defaultTheme
    }

    return {
      colors: { ...this.defaultTheme.colors, ...partialTheme.colors },
      sizes: { ...this.defaultTheme.sizes, ...partialTheme.sizes },
      styles: { ...this.defaultTheme.styles, ...partialTheme.styles },
    }
  }

  private renderDefaultEdge(
    context: EdgeRenderContext,
    pathType: EdgePathType
  ): Group {
    const { edge, isSelected, isHovered, theme } = context

    const group = new Group()

    const sourcePos = edge.sourcePort.getAbsolutePosition()
    const targetPos = edge.targetPort.getAbsolutePosition()

    if (!sourcePos || !targetPos) {
      return group
    }

    // Generate path
    const pathData = this.generatePath(
      sourcePos,
      targetPos,
      pathType,
      this.getPortDirection(edge.sourcePort.position),
      this.getPortDirection(edge.targetPort.position)
    )

    // Determine stroke color
    let strokeColor = theme.colors.default
    if (isSelected) {
      strokeColor = theme.colors.selected
    } else if (isHovered) {
      strokeColor = theme.colors.hovered
    }

    // Create path
    const path = new Path({
      path: pathData,
      stroke: strokeColor,
      strokeWidth: isSelected
        ? theme.sizes.selectedStrokeWidth
        : theme.sizes.strokeWidth,
      fill: 'none',
      strokeLinecap: theme.styles.strokeLinecap,
      strokeLinejoin: theme.styles.strokeLinejoin,
    })
    group.add(path)

    // Add arrow
    const arrow = this.createArrow(targetPos, sourcePos, theme)
    group.add(arrow)

    return group
  }

  private generateBezierPath(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number },
    sourceDirection?: { x: number; y: number },
    targetDirection?: { x: number; y: number }
  ): string {
    const dx = targetPos.x - sourcePos.x
    const dy = targetPos.y - sourcePos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const offset = Math.min(distance * 0.5, 100)

    // Use provided directions or calculate default ones
    const srcDir = sourceDirection || { x: 1, y: 0 }
    const tgtDir = targetDirection || { x: -1, y: 0 }

    const cp1 = {
      x: sourcePos.x + srcDir.x * offset,
      y: sourcePos.y + srcDir.y * offset,
    }

    const cp2 = {
      x: targetPos.x + tgtDir.x * offset,
      y: targetPos.y + tgtDir.y * offset,
    }

    return `M ${sourcePos.x} ${sourcePos.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${targetPos.x} ${targetPos.y}`
  }

  private generateStraightPath(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number }
  ): string {
    return `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`
  }

  private generateOrthogonalPath(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number }
  ): string {
    const midX = (sourcePos.x + targetPos.x) / 2

    return `M ${sourcePos.x} ${sourcePos.y} L ${midX} ${sourcePos.y} L ${midX} ${targetPos.y} L ${targetPos.x} ${targetPos.y}`
  }

  private generateSmoothStepPath(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number }
  ): string {
    const midX = (sourcePos.x + targetPos.x) / 2
    const cornerRadius = 10

    if (Math.abs(sourcePos.y - targetPos.y) < cornerRadius * 2) {
      // If the vertical distance is too small, use straight line
      return this.generateStraightPath(sourcePos, targetPos)
    }

    const path = [
      `M ${sourcePos.x} ${sourcePos.y}`,
      `L ${midX - cornerRadius} ${sourcePos.y}`,
      `Q ${midX} ${sourcePos.y} ${midX} ${
        sourcePos.y + (sourcePos.y < targetPos.y ? cornerRadius : -cornerRadius)
      }`,
      `L ${midX} ${
        targetPos.y + (sourcePos.y < targetPos.y ? -cornerRadius : cornerRadius)
      }`,
      `Q ${midX} ${targetPos.y} ${midX + cornerRadius} ${targetPos.y}`,
      `L ${targetPos.x} ${targetPos.y}`,
    ]

    return path.join(' ')
  }

  private createArrow(
    targetPos: { x: number; y: number },
    sourcePos: { x: number; y: number },
    theme: EdgeTheme
  ): Polygon {
    const angle = Math.atan2(
      targetPos.y - sourcePos.y,
      targetPos.x - sourcePos.x
    )
    const arrowSize = theme.sizes.arrowSize

    const arrowPoints = [
      { x: 0, y: 0 },
      { x: -arrowSize, y: -arrowSize / 2 },
      { x: -arrowSize, y: arrowSize / 2 },
    ]

    // Rotate and translate arrow points
    const rotatedPoints = arrowPoints.map(point => ({
      x: targetPos.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
      y: targetPos.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
    }))

    return new Polygon({
      points: rotatedPoints,
      fill: theme.colors.arrow,
      stroke: 'none',
    })
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

  private registerBuiltInRenderers(): void {
    // Register some built-in edge renderers

    // Dashed edge renderer
    this.registerRenderer('dashed', {
      render: (context: EdgeRenderContext) => {
        const group = this.renderDefaultEdge(context, 'bezier')
        const path = group.children[0] as Path
        if (path) {
          ;(path as any).strokeDasharray = '5,5'
        }
        return group
      },
    })

    // Thick edge renderer
    this.registerRenderer('thick', {
      render: (context: EdgeRenderContext) => {
        const group = this.renderDefaultEdge(context, 'bezier')
        const path = group.children[0] as Path
        if (path) {
          const currentWidth = (path as any).strokeWidth || 2
          ;(path as any).strokeWidth = currentWidth * 2
        }
        return group
      },
    })

    // Animated edge renderer
    this.registerRenderer('animated', {
      render: (context: EdgeRenderContext) => {
        const group = this.renderDefaultEdge(context, 'bezier')
        const path = group.children[0] as Path
        if (path) {
          ;(path as any).strokeDasharray = '10,5'
          // Note: Animation would need to be implemented with LeaferJS animation system
        }
        return group
      },
    })

    // Data flow edge renderer (with flow indicators)
    this.registerRenderer('data-flow', {
      render: (context: EdgeRenderContext) => {
        const group = this.renderDefaultEdge(context, 'bezier')

        // Add flow indicators (small circles along the path)
        const sourcePos = context.edge.sourcePort.getAbsolutePosition()
        const targetPos = context.edge.targetPort.getAbsolutePosition()

        if (sourcePos && targetPos) {
          const numIndicators = 3
          for (let i = 1; i <= numIndicators; i++) {
            const t = i / (numIndicators + 1)
            const x = sourcePos.x + (targetPos.x - sourcePos.x) * t
            const y = sourcePos.y + (targetPos.y - sourcePos.y) * t

            const indicator = new Rect({
              width: 4,
              height: 4,
              fill: context.theme.colors.default,
              cornerRadius: 2,
              x: x - 2,
              y: y - 2,
            })
            group.add(indicator)
          }
        }

        return group
      },
    })
  }
}
