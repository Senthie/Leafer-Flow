// Basic tests for FlowPort class

import { FlowPort } from '../../src/components/FlowPort'
import { FlowNode } from '../../src/components/FlowNode'
import { PortData, NodeData } from '../../src/types'

describe('FlowPort', () => {
  let parentNode: FlowNode
  let portData: PortData

  beforeEach(() => {
    const nodeData: NodeData = {
      id: 'node-1',
      type: 'default',
      position: { x: 100, y: 200 },
      data: {},
    }
    parentNode = new FlowNode(nodeData)

    portData = {
      id: 'port-1',
      type: 'input',
      position: 'left',
      dataType: 'string',
      multiple: false,
    }
  })

  describe('initialization', () => {
    it('should create FlowPort with correct properties', () => {
      const port = new FlowPort(portData, parentNode)

      expect(port.id).toBe('port-1')
      expect(port.type).toBe('input')
      expect(port.position).toBe('left')
      expect(port.dataType).toBe('string')
      expect(port.multiple).toBe(false)
      expect(port.parentNode).toBe(parentNode)
    })

    it('should default multiple to false when not specified', () => {
      const portDataWithoutMultiple = { ...portData }
      delete portDataWithoutMultiple.multiple

      const port = new FlowPort(portDataWithoutMultiple, parentNode)
      expect(port.multiple).toBe(false)
    })
  })

  describe('connection management', () => {
    let port: FlowPort

    beforeEach(() => {
      port = new FlowPort(portData, parentNode)
    })

    it('should add connection correctly', () => {
      const result = port.addConnection('edge-1')
      expect(result).toBe(true)
      expect(port.getConnections()).toContain('edge-1')
      expect(port.hasConnections()).toBe(true)
    })

    it('should remove connection correctly', () => {
      port.addConnection('edge-1')
      const result = port.removeConnection('edge-1')

      expect(result).toBe(true)
      expect(port.getConnections()).not.toContain('edge-1')
      expect(port.hasConnections()).toBe(false)
    })

    it('should handle single connection port correctly', () => {
      // Port with multiple: false should replace existing connection
      port.addConnection('edge-1')
      port.addConnection('edge-2')

      const connections = port.getConnections()
      expect(connections).toHaveLength(1)
      expect(connections).toContain('edge-2')
      expect(connections).not.toContain('edge-1')
    })

    it('should handle multiple connection port correctly', () => {
      const multiplePortData: PortData = {
        ...portData,
        multiple: true,
      }
      const multiplePort = new FlowPort(multiplePortData, parentNode)

      multiplePort.addConnection('edge-1')
      multiplePort.addConnection('edge-2')

      const connections = multiplePort.getConnections()
      expect(connections).toHaveLength(2)
      expect(connections).toContain('edge-1')
      expect(connections).toContain('edge-2')
    })
  })

  describe('connection validation', () => {
    it('should not allow connection between same type ports', () => {
      const inputPort1 = new FlowPort(portData, parentNode)
      const inputPort2 = new FlowPort({ ...portData, id: 'port-2' }, parentNode)

      expect(inputPort1.canConnect(inputPort2)).toBe(false)
    })

    it('should allow connection between different type ports', () => {
      const inputPort = new FlowPort(portData, parentNode)
      const outputPort = new FlowPort(
        {
          ...portData,
          id: 'port-2',
          type: 'output',
        },
        parentNode
      )

      expect(inputPort.canConnect(outputPort)).toBe(true)
    })

    it('should validate data type compatibility', () => {
      const stringInputPort = new FlowPort(portData, parentNode)
      const stringOutputPort = new FlowPort(
        {
          ...portData,
          id: 'port-2',
          type: 'output',
          dataType: 'string',
        },
        parentNode
      )
      const numberOutputPort = new FlowPort(
        {
          ...portData,
          id: 'port-3',
          type: 'output',
          dataType: 'number',
        },
        parentNode
      )

      expect(stringInputPort.canConnect(stringOutputPort)).toBe(true)
      expect(stringInputPort.canConnect(numberOutputPort)).toBe(false)
    })

    it('should allow connection when no data types specified', () => {
      const { dataType, ...portDataWithoutType } = portData
      const inputPortNoType = new FlowPort(portDataWithoutType, parentNode)
      const outputPortNoType = new FlowPort(
        {
          ...portDataWithoutType,
          id: 'port-2',
          type: 'output',
        },
        parentNode
      )

      expect(inputPortNoType.canConnect(outputPortNoType)).toBe(true)
    })
  })

  describe('position calculation', () => {
    it('should calculate absolute position based on parent node', () => {
      const port = new FlowPort(portData, parentNode)
      const position = port.getAbsolutePosition()

      // Should be parent position + offset for left position
      expect(position.x).toBe(50) // 100 - 50
      expect(position.y).toBe(200) // 200 + 0
    })

    it('should calculate different offsets for different positions', () => {
      const positions: Array<'top' | 'right' | 'bottom' | 'left'> = [
        'top',
        'right',
        'bottom',
        'left',
      ]

      positions.forEach(position => {
        const port = new FlowPort(
          {
            ...portData,
            position,
          },
          parentNode
        )
        const absolutePos = port.getAbsolutePosition()

        expect(typeof absolutePos.x).toBe('number')
        expect(typeof absolutePos.y).toBe('number')
      })
    })
  })
})
