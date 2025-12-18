// Basic tests for FlowNode class

import { FlowNode } from '../../src/components/FlowNode'
import { NodeData, PortData } from '../../src/types'

describe('FlowNode', () => {
  const mockNodeData: NodeData = {
    id: 'node-1',
    type: 'default',
    position: { x: 100, y: 200 },
    data: { label: 'Test Node' },
  }

  describe('initialization', () => {
    it('should create FlowNode with basic data', () => {
      const node = new FlowNode(mockNodeData)

      expect(node.id).toBe('node-1')
      expect(node.type).toBe('default')
      expect(node.position).toEqual({ x: 100, y: 200 })
      expect(node.data).toEqual({ label: 'Test Node' })
      expect(node.ports.size).toBe(0)
    })

    it('should create FlowNode with ports', () => {
      const nodeDataWithPorts: NodeData = {
        ...mockNodeData,
        ports: [
          { id: 'input-1', type: 'input', position: 'left' },
          { id: 'output-1', type: 'output', position: 'right' },
        ],
      }

      const node = new FlowNode(nodeDataWithPorts)
      expect(node.ports.size).toBe(2)
      expect(node.getPort('input-1')).toBeTruthy()
      expect(node.getPort('output-1')).toBeTruthy()
    })
  })

  describe('port management', () => {
    let node: FlowNode

    beforeEach(() => {
      node = new FlowNode(mockNodeData)
    })

    it('should add port correctly', () => {
      const portData: PortData = {
        id: 'port-1',
        type: 'input',
        position: 'left',
      }

      const port = node.addPort(portData)
      expect(port).toBeTruthy()
      expect(node.ports.size).toBe(1)
      expect(node.getPort('port-1')).toBe(port)
    })

    it('should remove port correctly', () => {
      const portData: PortData = {
        id: 'port-1',
        type: 'input',
        position: 'left',
      }

      node.addPort(portData)
      expect(node.ports.size).toBe(1)

      const removed = node.removePort('port-1')
      expect(removed).toBe(true)
      expect(node.ports.size).toBe(0)
      expect(node.getPort('port-1')).toBeNull()
    })

    it('should return null for non-existent port', () => {
      expect(node.getPort('non-existent')).toBeNull()
    })

    it('should return all ports', () => {
      const portData1: PortData = {
        id: 'port-1',
        type: 'input',
        position: 'left',
      }
      const portData2: PortData = {
        id: 'port-2',
        type: 'output',
        position: 'right',
      }

      node.addPort(portData1)
      node.addPort(portData2)

      const allPorts = node.getAllPorts()
      expect(allPorts).toHaveLength(2)
    })
  })

  describe('position and data updates', () => {
    let node: FlowNode

    beforeEach(() => {
      node = new FlowNode(mockNodeData)
    })

    it('should update position correctly', () => {
      node.updatePosition(300, 400)
      expect(node.position).toEqual({ x: 300, y: 400 })
    })

    it('should update data correctly', () => {
      node.updateData({ label: 'Updated Node', color: 'blue' })
      expect(node.data).toEqual({
        label: 'Updated Node',
        color: 'blue',
      })
    })

    it('should merge data when updating', () => {
      node.data = { label: 'Original', value: 42 }
      node.updateData({ label: 'Updated' })
      expect(node.data).toEqual({
        label: 'Updated',
        value: 42,
      })
    })
  })

  describe('selection state', () => {
    let node: FlowNode

    beforeEach(() => {
      node = new FlowNode(mockNodeData)
    })

    it('should initialize with unselected state', () => {
      expect(node.isSelected).toBe(false)
    })

    it('should update selection state', () => {
      node.isSelected = true
      expect(node.isSelected).toBe(true)

      node.isSelected = false
      expect(node.isSelected).toBe(false)
    })
  })

  describe('visual components', () => {
    let node: FlowNode

    beforeEach(() => {
      node = new FlowNode(mockNodeData)
    })

    it('should have visual components after initialization', () => {
      expect(node.children).toHaveLength(2) // background + label
    })

    it('should get node dimensions', () => {
      const dimensions = node.getDimensions()
      expect(dimensions).toEqual({ width: 120, height: 60 })
    })

    it('should get port absolute position', () => {
      const portData: PortData = {
        id: 'test-port',
        type: 'input',
        position: 'left',
      }
      node.addPort(portData)

      const position = node.getPortAbsolutePosition('test-port')
      expect(position).toEqual({ x: 100, y: 230 }) // node position + port offset
    })

    it('should return null for non-existent port position', () => {
      const position = node.getPortAbsolutePosition('non-existent')
      expect(position).toBeNull()
    })
  })
})
