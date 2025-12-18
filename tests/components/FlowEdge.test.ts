// FlowEdge component tests

import { FlowEdge } from '../../src/components/FlowEdge'
import { FlowNode } from '../../src/components/FlowNode'
import { FlowPort } from '../../src/components/FlowPort'
import { EdgeData, NodeData, PortData } from '../../src/types'

describe('FlowEdge', () => {
  let sourceNode: FlowNode
  let targetNode: FlowNode
  let sourcePort: FlowPort
  let targetPort: FlowPort
  let edgeData: EdgeData

  beforeEach(() => {
    // Create source node with output port
    const sourceNodeData: NodeData = {
      id: 'source-node',
      type: 'test',
      position: { x: 0, y: 0 },
      data: { label: 'Source' },
      ports: [
        {
          id: 'output-port',
          type: 'output',
          position: 'right',
        } as PortData,
      ],
    }
    sourceNode = new FlowNode(sourceNodeData)
    sourcePort = sourceNode.getPort('output-port')!

    // Create target node with input port
    const targetNodeData: NodeData = {
      id: 'target-node',
      type: 'test',
      position: { x: 200, y: 0 },
      data: { label: 'Target' },
      ports: [
        {
          id: 'input-port',
          type: 'input',
          position: 'left',
        } as PortData,
      ],
    }
    targetNode = new FlowNode(targetNodeData)
    targetPort = targetNode.getPort('input-port')!

    edgeData = {
      id: 'test-edge',
      source: 'source-node',
      sourcePort: 'output-port',
      target: 'target-node',
      targetPort: 'input-port',
    }
  })

  describe('Construction', () => {
    it('should create edge with correct properties', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      expect(edge.id).toBe('test-edge')
      expect(edge.source).toBe(sourceNode)
      expect(edge.sourcePort).toBe(sourcePort)
      expect(edge.target).toBe(targetNode)
      expect(edge.targetPort).toBe(targetPort)
    })

    it('should add connection references to ports', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      expect(edge.id).toBe('test-edge')
      expect(sourcePort.getConnections()).toContain('test-edge')
      expect(targetPort.getConnections()).toContain('test-edge')
    })

    it('should initialize with default styling', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      expect(edge.stroke).toBe('#666666')
      expect(edge.strokeWidth).toBe(2)
      expect(edge.fill).toBe('none')
    })
  })

  describe('Path Calculation', () => {
    it('should update path when updatePath is called', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )
      const initialPath = edge.path

      // Move target node
      targetNode.updatePosition(300, 100)
      edge.updatePath()

      expect(edge.path).not.toBe(initialPath)
      expect(edge.path).toContain('M') // Should contain move command
      expect(edge.path).toContain('C') // Should contain curve command
    })

    it('should calculate control points for smooth curves', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      expect(edge.path).toContain('C') // Should use bezier curves
    })
  })

  describe('Selection State', () => {
    it('should start unselected', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      expect(edge.isSelected).toBe(false)
    })

    it('should update visual style when selected', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )
      const initialStroke = edge.stroke
      const initialStrokeWidth = edge.strokeWidth

      edge.isSelected = true

      expect(edge.stroke).not.toBe(initialStroke)
      expect(edge.strokeWidth).not.toBe(initialStrokeWidth)
      expect(edge.stroke).toBe('#007acc')
      expect(edge.strokeWidth).toBe(3)
    })

    it('should revert visual style when deselected', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      edge.isSelected = true
      edge.isSelected = false

      expect(edge.stroke).toBe('#666666')
      expect(edge.strokeWidth).toBe(2)
    })
  })

  describe('Style Management', () => {
    it('should apply custom styles', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      edge.setStyle({
        stroke: '#ff0000',
        strokeWidth: 4,
      })

      expect(edge.stroke).toBe('#ff0000')
      expect(edge.strokeWidth).toBe(4)
    })

    it('should merge custom styles with defaults', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      edge.setStyle({
        stroke: '#ff0000',
      })

      expect(edge.stroke).toBe('#ff0000')
      expect(edge.fill).toBe('none') // Should keep default
    })

    it('should return current style', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      edge.setStyle({
        stroke: '#ff0000',
        strokeWidth: 4,
      })

      const style = edge.getStyle()
      expect(style.stroke).toBe('#ff0000')
      expect(style.strokeWidth).toBe(4)
    })
  })

  describe('Data Management', () => {
    it('should update edge data', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      edge.updateData({ customProperty: 'test' })

      expect(edge.edgeData.customProperty).toBe('test')
    })

    it('should merge new data with existing data', () => {
      const edgeDataWithData = {
        ...edgeData,
        data: { existing: 'value' },
      }
      const edge = new FlowEdge(
        edgeDataWithData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      edge.updateData({ new: 'property' })

      expect(edge.edgeData.existing).toBe('value')
      expect(edge.edgeData.new).toBe('property')
    })
  })

  describe('Node Movement Updates', () => {
    it('should update path when nodes move', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )
      const initialPath = edge.path

      // Move source node
      sourceNode.updatePosition(50, 50)
      edge.updateForNodeMovement()

      expect(edge.path).not.toBe(initialPath)
    })
  })

  describe('Bounds Calculation', () => {
    it('should calculate correct bounds', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      const bounds = edge.getBounds()

      expect(bounds.x).toBeLessThanOrEqual(bounds.x + bounds.width)
      expect(bounds.y).toBeLessThanOrEqual(bounds.y + bounds.height)
      expect(bounds.width).toBeGreaterThanOrEqual(0)
      expect(bounds.height).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Point Distance Detection', () => {
    it('should detect points near the path', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      // Get actual port positions for more accurate testing
      const sourcePos = sourcePort.getAbsolutePosition()
      const targetPos = targetPort.getAbsolutePosition()

      // Point near the middle of the line
      const nearPoint = {
        x: (sourcePos.x + targetPos.x) / 2,
        y: (sourcePos.y + targetPos.y) / 2,
      }
      expect(edge.isPointNearPath(nearPoint, 20)).toBe(true)

      // Point far from the line
      const farPoint = { x: nearPoint.x, y: nearPoint.y + 100 }
      expect(edge.isPointNearPath(farPoint, 20)).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should remove connection references when destroyed', () => {
      const edge = new FlowEdge(
        edgeData,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort
      )

      expect(sourcePort.getConnections()).toContain('test-edge')
      expect(targetPort.getConnections()).toContain('test-edge')

      edge.destroy()

      expect(sourcePort.getConnections()).not.toContain('test-edge')
      expect(targetPort.getConnections()).not.toContain('test-edge')
    })
  })
})
