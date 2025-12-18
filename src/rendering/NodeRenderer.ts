// NodeRenderer - advanced custom node rendering system

import { Group, Rect, Text, Path } from 'leafer-ui'
import { FlowNode } from '../components/FlowNode'

export interface NodeRenderContext {
  node: FlowNode
  isSelected: boolean
  isHovered: boolean
  scale: number
  theme: NodeTheme
}

export interface NodeTheme {
  colors: {
    background: string
    border: string
    selectedBorder: string
    text: string
    port: {
      input: string
      output: string
    }
  }
  sizes: {
    borderWidth: number
    selectedBorderWidth: number
    cornerRadius: number
    fontSize: number
    portSize: number
  }
  spacing: {
    padding: number
    portSpacing: number
  }
}

export interface CustomNodeRenderer {
  render(context: NodeRenderContext): Group
  update?(context: NodeRenderContext, existingGroup: Group): void
  getSize?(data: any): { width: number; height: number }
  getPortPositions?(
    data: any,
    size: { width: number; height: number }
  ): Array<{
    id: string
    x: number
    y: number
  }>
}

export class NodeRenderer {
  private customRenderers: Map<string, CustomNodeRenderer> = new Map()
  private defaultTheme: NodeTheme

  constructor() {
    this.defaultTheme = this.createDefaultTheme()
    this.registerBuiltInRenderers()
  }

  // Register a custom renderer for a node type
  public registerRenderer(
    nodeType: string,
    renderer: CustomNodeRenderer
  ): void {
    this.customRenderers.set(nodeType, renderer)
  }

  // Unregister a custom renderer
  public unregisterRenderer(nodeType: string): boolean {
    return this.customRenderers.delete(nodeType)
  }

  // Render a node using the appropriate renderer
  public renderNode(
    node: FlowNode,
    options: {
      isSelected?: boolean
      isHovered?: boolean
      scale?: number
      theme?: Partial<NodeTheme>
    } = {}
  ): Group {
    const context: NodeRenderContext = {
      node,
      isSelected: options.isSelected || false,
      isHovered: options.isHovered || false,
      scale: options.scale || 1.0,
      theme: this.mergeTheme(options.theme),
    }

    const renderer = this.customRenderers.get(node.type)
    if (renderer) {
      return renderer.render(context)
    }

    // Fall back to default renderer
    return this.renderDefaultNode(context)
  }

  // Update an existing rendered node
  public updateNode(
    node: FlowNode,
    existingGroup: Group,
    options: {
      isSelected?: boolean
      isHovered?: boolean
      scale?: number
      theme?: Partial<NodeTheme>
    } = {}
  ): void {
    const context: NodeRenderContext = {
      node,
      isSelected: options.isSelected || false,
      isHovered: options.isHovered || false,
      scale: options.scale || 1.0,
      theme: this.mergeTheme(options.theme),
    }

    const renderer = this.customRenderers.get(node.type)
    if (renderer && renderer.update) {
      renderer.update(context, existingGroup)
      return
    }

    // Fall back to re-rendering
    const newGroup = this.renderNode(node, options)
    existingGroup.removeAll()
    newGroup.children.forEach(child => existingGroup.add(child))
  }

  // Get node size for a given type and data
  public getNodeSize(
    nodeType: string,
    data: any
  ): { width: number; height: number } {
    const renderer = this.customRenderers.get(nodeType)
    if (renderer && renderer.getSize) {
      return renderer.getSize(data)
    }

    // Default size
    return { width: 120, height: 60 }
  }

  // Get port positions for a node
  public getPortPositions(
    nodeType: string,
    data: any,
    size: { width: number; height: number }
  ): Array<{ id: string; x: number; y: number }> {
    const renderer = this.customRenderers.get(nodeType)
    if (renderer && renderer.getPortPositions) {
      return renderer.getPortPositions(data, size)
    }

    // Default port positions
    return this.getDefaultPortPositions(data, size)
  }

  // Private methods
  private createDefaultTheme(): NodeTheme {
    return {
      colors: {
        background: '#ffffff',
        border: '#cccccc',
        selectedBorder: '#007acc',
        text: '#333333',
        port: {
          input: '#4CAF50',
          output: '#FF9800',
        },
      },
      sizes: {
        borderWidth: 1,
        selectedBorderWidth: 2,
        cornerRadius: 4,
        fontSize: 12,
        portSize: 8,
      },
      spacing: {
        padding: 8,
        portSpacing: 16,
      },
    }
  }

  private mergeTheme(partialTheme?: Partial<NodeTheme>): NodeTheme {
    if (!partialTheme) {
      return this.defaultTheme
    }

    return {
      colors: { ...this.defaultTheme.colors, ...partialTheme.colors },
      sizes: { ...this.defaultTheme.sizes, ...partialTheme.sizes },
      spacing: { ...this.defaultTheme.spacing, ...partialTheme.spacing },
    }
  }

  private renderDefaultNode(context: NodeRenderContext): Group {
    const { node, isSelected, theme } = context
    const size = this.getNodeSize(node.type, node.data)

    const group = new Group()

    // Background
    const background = new Rect({
      width: size.width,
      height: size.height,
      fill: theme.colors.background,
      stroke: isSelected ? theme.colors.selectedBorder : theme.colors.border,
      strokeWidth: isSelected
        ? theme.sizes.selectedBorderWidth
        : theme.sizes.borderWidth,
      cornerRadius: theme.sizes.cornerRadius,
    })
    group.add(background)

    // Label
    const label = new Text({
      text: node.data?.label || node.type,
      fontSize: theme.sizes.fontSize,
      fill: theme.colors.text,
      textAlign: 'center',
      verticalAlign: 'middle',
      x: size.width / 2,
      y: size.height / 2,
    })
    group.add(label)

    // Ports
    const portPositions = this.getPortPositions(node.type, node.data, size)
    portPositions.forEach(portPos => {
      const port = node.getPort(portPos.id)
      if (port) {
        const portVisual = new Rect({
          width: theme.sizes.portSize,
          height: theme.sizes.portSize,
          fill: theme.colors.port[port.type],
          stroke: theme.colors.border,
          strokeWidth: 1,
          cornerRadius: theme.sizes.portSize / 2,
          x: portPos.x - theme.sizes.portSize / 2,
          y: portPos.y - theme.sizes.portSize / 2,
        })
        group.add(portVisual)
      }
    })

    return group
  }

  private getDefaultPortPositions(
    data: any,
    size: { width: number; height: number }
  ): Array<{ id: string; x: number; y: number }> {
    const positions: Array<{ id: string; x: number; y: number }> = []

    // This is a simplified implementation
    // In a real scenario, this would be based on the node's port configuration
    if (data?.ports) {
      data.ports.forEach((port: any) => {
        switch (port.position) {
          case 'top':
            positions.push({ id: port.id, x: size.width / 2, y: 0 })
            break
          case 'right':
            positions.push({ id: port.id, x: size.width, y: size.height / 2 })
            break
          case 'bottom':
            positions.push({ id: port.id, x: size.width / 2, y: size.height })
            break
          case 'left':
            positions.push({ id: port.id, x: 0, y: size.height / 2 })
            break
        }
      })
    }

    return positions
  }

  private registerBuiltInRenderers(): void {
    // Register some built-in node renderers

    // Process node renderer
    this.registerRenderer('process', {
      render: (context: NodeRenderContext) => {
        const { node, isSelected, theme } = context
        const size = { width: 140, height: 80 }

        const group = new Group()

        // Rounded rectangle background
        const background = new Rect({
          width: size.width,
          height: size.height,
          fill: '#e3f2fd',
          stroke: isSelected ? theme.colors.selectedBorder : '#2196f3',
          strokeWidth: isSelected
            ? theme.sizes.selectedBorderWidth
            : theme.sizes.borderWidth,
          cornerRadius: 8,
        })
        group.add(background)

        // Icon (simplified gear shape)
        const icon = new Path({
          path: 'M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7.29C13.89,7.63 14.73,8.17 15.46,8.88L16.71,7.63C17.05,7.29 17.71,7.29 18.05,7.63C18.39,7.97 18.39,8.63 18.05,8.97L16.8,10.22C17.5,10.95 18.04,11.79 18.38,12.68H20C20.55,12.68 21,13.13 21,13.68C21,14.23 20.55,14.68 20,14.68H18.38C18.04,15.57 17.5,16.41 16.8,17.14L18.05,18.39C18.39,18.73 18.39,19.39 18.05,19.73C17.71,20.07 17.05,20.07 16.71,19.73L15.46,18.48C14.73,19.19 13.89,19.73 13,20.07V21.73C13.6,22.07 14,22.72 14,23.46C14,24.51 13.05,25.46 12,25.46C10.95,25.46 10,24.51 10,23.46C10,22.72 10.4,22.07 11,21.73V20.07C10.11,19.73 9.27,19.19 8.54,18.48L7.29,19.73C6.95,20.07 6.29,20.07 5.95,19.73C5.61,19.39 5.61,18.73 5.95,18.39L7.2,17.14C6.5,16.41 5.96,15.57 5.62,14.68H4C3.45,14.68 3,14.23 3,13.68C3,13.13 3.45,12.68 4,12.68H5.62C5.96,11.79 6.5,10.95 7.2,10.22L5.95,8.97C5.61,8.63 5.61,7.97 5.95,7.63C6.29,7.29 6.95,7.29 7.29,7.63L8.54,8.88C9.27,8.17 10.11,7.63 11,7.29V5.73C10.4,5.39 10,4.74 10,4C10,2.95 10.95,2 12,2M12,8.5A5.5,5.5 0 0,0 6.5,14A5.5,5.5 0 0,0 12,19.5A5.5,5.5 0 0,0 17.5,14A5.5,5.5 0 0,0 12,8.5M12,11A3,3 0 0,1 15,14A3,3 0 0,1 12,17A3,3 0 0,1 9,14A3,3 0 0,1 12,11Z',
          fill: '#2196f3',
          scale: 0.8,
          x: 20,
          y: 20,
        })
        group.add(icon)

        // Label
        const label = new Text({
          text: node.data?.label || 'Process',
          fontSize: 14,
          fill: '#1976d2',
          fontWeight: 'bold',
          textAlign: 'center',
          verticalAlign: 'middle',
          x: size.width / 2,
          y: size.height / 2 + 10,
        })
        group.add(label)

        return group
      },
      getSize: () => ({ width: 140, height: 80 }),
    })

    // Decision node renderer
    this.registerRenderer('decision', {
      render: (context: NodeRenderContext) => {
        const { node, isSelected, theme } = context
        const size = { width: 120, height: 80 }

        const group = new Group()

        // Diamond shape
        const diamond = new Path({
          path: `M ${size.width / 2} 0 L ${size.width} ${size.height / 2} L ${
            size.width / 2
          } ${size.height} L 0 ${size.height / 2} Z`,
          fill: '#fff3e0',
          stroke: isSelected ? theme.colors.selectedBorder : '#ff9800',
          strokeWidth: isSelected
            ? theme.sizes.selectedBorderWidth
            : theme.sizes.borderWidth,
        })
        group.add(diamond)

        // Label
        const label = new Text({
          text: node.data?.label || 'Decision',
          fontSize: 12,
          fill: '#f57c00',
          fontWeight: 'bold',
          textAlign: 'center',
          verticalAlign: 'middle',
          x: size.width / 2,
          y: size.height / 2,
        })
        group.add(label)

        return group
      },
      getSize: () => ({ width: 120, height: 80 }),
    })

    // Data node renderer
    this.registerRenderer('data', {
      render: (context: NodeRenderContext) => {
        const { node, isSelected, theme } = context
        const size = { width: 100, height: 60 }

        const group = new Group()

        // Parallelogram shape
        const parallelogram = new Path({
          path: `M 10 0 L ${size.width} 0 L ${size.width - 10} ${
            size.height
          } L 0 ${size.height} Z`,
          fill: '#f3e5f5',
          stroke: isSelected ? theme.colors.selectedBorder : '#9c27b0',
          strokeWidth: isSelected
            ? theme.sizes.selectedBorderWidth
            : theme.sizes.borderWidth,
        })
        group.add(parallelogram)

        // Label
        const label = new Text({
          text: node.data?.label || 'Data',
          fontSize: 12,
          fill: '#7b1fa2',
          fontWeight: 'bold',
          textAlign: 'center',
          verticalAlign: 'middle',
          x: size.width / 2,
          y: size.height / 2,
        })
        group.add(label)

        return group
      },
      getSize: () => ({ width: 100, height: 60 }),
    })
  }
}
