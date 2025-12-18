// NodeManager tests

import { NodeManager } from '../../src/managers/NodeManager'
import { NodeData, NodeTypeDefinition } from '../../src/types'
import { FlowError } from '../../src/errors/FlowError'

describe('NodeManager', () => {
  let nodeManager: NodeManager
  let eventSpy: jest.Mock

  beforeEach(() => {
    eventSpy = jest.fn()
    nodeManager = new NodeManager({
      onEvent: eventSpy,
    })
  })

  describe('Node Type Registration', () => {
    it('should register a new node type', () => {
      const nodeType: NodeTypeDefinition = {
        render: node => node,
        defaultData: { label: 'Test Node' },
        validate: data => !!data.label,
      }

      nodeManager.registerNodeType('test', nodeType)
      const retrieved = nodeManager.getNodeType('test')

      expect(retrieved).toBe(nodeType)
    })

    it('should throw error for invalid node type', () => {
      expect(() => {
        nodeManager.registerNodeType('', {} as NodeTypeDefinition)
      }).toThrow(FlowError)
    })

    it('should unregister a node type', () => {
      const nodeType: NodeTypeDefinition = {
        render: node => node,
      }

      nodeManager.registerNodeType('test', nodeType)
      expect(nodeManager.getNodeType('test')).toBe(nodeType)

      const unregistered = nodeManager.unregisterNodeType('test')
      expect(unregistered).toBe(true)
      expect(nodeManager.getNodeType('test')).toBeNull()
    })

    it('should return all registered node types', () => {
      const nodeType1: NodeTypeDefinition = { render: node => node }
      const nodeType2: NodeTypeDefinition = { render: node => node }

      nodeManager.registerNodeType('type1', nodeType1)
      nodeManager.registerNodeType('type2', nodeType2)

      const allTypes = nodeManager.getAllNodeTypes()
      expect(allTypes).toHaveProperty('type1', nodeType1)
      expect(allTypes).toHaveProperty('type2', nodeType2)
      expect(allTypes).toHaveProperty('default') // Default type should exist
    })
  })

  describe('Node Creation', () => {
    const validNodeData: NodeData = {
      id: 'node1',
      type: 'default',
      position: { x: 100, y: 200 },
      data: { label: 'Test Node' },
    }

    it('should create a node with valid data', () => {
      const node = nodeManager.createNode(validNodeData)

      expect(node.id).toBe('node1')
      expect(node.type).toBe('default')
      expect(node.position).toEqual({ x: 100, y: 200 })
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node:created',
          data: expect.objectContaining({
            nodeId: 'node1',
            node: node,
          }),
        })
      )
    })

    it('should throw error for duplicate node ID', () => {
      nodeManager.createNode(validNodeData)

      expect(() => {
        nodeManager.createNode(validNodeData)
      }).toThrow(FlowError)
    })

    it('should throw error for unknown node type', () => {
      const invalidNodeData = {
        ...validNodeData,
        type: 'unknown',
      }

      expect(() => {
        nodeManager.createNode(invalidNodeData)
      }).toThrow(FlowError)
    })

    it('should validate node data', () => {
      expect(() => {
        nodeManager.createNode({} as NodeData)
      }).toThrow(FlowError)

      expect(() => {
        nodeManager.createNode({
          id: '',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {},
        })
      }).toThrow(FlowError)
    })

    it('should merge default data with provided data', () => {
      const customType: NodeTypeDefinition = {
        render: node => node,
        defaultData: {
          label: 'Default Label',
          color: 'blue',
        },
      }

      nodeManager.registerNodeType('custom', customType)

      const node = nodeManager.createNode({
        id: 'node1',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { label: 'Custom Label' },
      })

      expect(node.data.label).toBe('Custom Label')
      expect(node.data.color).toBe('blue')
    })
  })

  describe('Node Retrieval', () => {
    beforeEach(() => {
      nodeManager.createNode({
        id: 'node1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: {},
      })
      nodeManager.createNode({
        id: 'node2',
        type: 'default',
        position: { x: 100, y: 100 },
        data: {},
      })
    })

    it('should get a node by ID', () => {
      const node = nodeManager.getNode('node1')
      expect(node).toBeTruthy()
      expect(node?.id).toBe('node1')
    })

    it('should return null for non-existent node', () => {
      const node = nodeManager.getNode('nonexistent')
      expect(node).toBeNull()
    })

    it('should get all nodes', () => {
      const nodes = nodeManager.getAllNodes()
      expect(nodes).toHaveLength(2)
      expect(nodes.map(n => n.id)).toContain('node1')
      expect(nodes.map(n => n.id)).toContain('node2')
    })

    it('should check if node exists', () => {
      expect(nodeManager.hasNode('node1')).toBe(true)
      expect(nodeManager.hasNode('nonexistent')).toBe(false)
    })

    it('should get node count', () => {
      expect(nodeManager.getNodeCount()).toBe(2)
    })
  })

  describe('Node Updates', () => {
    let nodeId: string

    beforeEach(() => {
      nodeId = 'node1'
      nodeManager.createNode({
        id: nodeId,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Original' },
      })
      eventSpy.mockClear() // Clear creation event
    })

    it('should update node position', () => {
      const node = nodeManager.updateNode(nodeId, {
        position: { x: 100, y: 200 },
      })

      expect(node.position).toEqual({ x: 100, y: 200 })
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node:updated',
          data: expect.objectContaining({
            nodeId,
            node,
            previousData: expect.any(Object),
          }),
        })
      )
    })

    it('should update node data', () => {
      const node = nodeManager.updateNode(nodeId, {
        data: { label: 'Updated' },
      })

      expect(node.data.label).toBe('Updated')
    })

    it('should throw error for non-existent node', () => {
      expect(() => {
        nodeManager.updateNode('nonexistent', { data: {} })
      }).toThrow(FlowError)
    })
  })

  describe('Node Deletion', () => {
    let nodeId: string

    beforeEach(() => {
      nodeId = 'node1'
      nodeManager.createNode({
        id: nodeId,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {},
      })
      eventSpy.mockClear() // Clear creation event
    })

    it('should delete an existing node', () => {
      const deleted = nodeManager.deleteNode(nodeId)

      expect(deleted).toBe(true)
      expect(nodeManager.getNode(nodeId)).toBeNull()
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node:deleted',
          data: expect.objectContaining({
            nodeId,
          }),
        })
      )
    })

    it('should return false for non-existent node', () => {
      const deleted = nodeManager.deleteNode('nonexistent')
      expect(deleted).toBe(false)
    })
  })

  describe('Batch Operations', () => {
    it('should create multiple nodes', () => {
      const nodesData: NodeData[] = [
        {
          id: 'node1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {},
        },
        {
          id: 'node2',
          type: 'default',
          position: { x: 100, y: 100 },
          data: {},
        },
      ]

      const nodes = nodeManager.createNodes(nodesData)

      expect(nodes).toHaveLength(2)
      expect(nodeManager.getNodeCount()).toBe(2)
    })

    it('should handle partial failures in batch creation', () => {
      const nodesData: NodeData[] = [
        {
          id: 'node1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {},
        },
        {
          id: 'node1', // Duplicate ID
          type: 'default',
          position: { x: 100, y: 100 },
          data: {},
        },
      ]

      expect(() => {
        nodeManager.createNodes(nodesData)
      }).toThrow(FlowError)

      // First node should still be created
      expect(nodeManager.getNode('node1')).toBeTruthy()
    })

    it('should delete multiple nodes', () => {
      // Create test nodes
      nodeManager.createNode({
        id: 'node1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: {},
      })
      nodeManager.createNode({
        id: 'node2',
        type: 'default',
        position: { x: 100, y: 100 },
        data: {},
      })

      const deletedIds = nodeManager.deleteNodes([
        'node1',
        'node2',
        'nonexistent',
      ])

      expect(deletedIds).toEqual(['node1', 'node2'])
      expect(nodeManager.getNodeCount()).toBe(0)
    })
  })

  describe('Selection Management', () => {
    beforeEach(() => {
      nodeManager.createNode({
        id: 'node1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: {},
      })
      nodeManager.createNode({
        id: 'node2',
        type: 'default',
        position: { x: 100, y: 100 },
        data: {},
      })
      eventSpy.mockClear() // Clear creation events
    })

    it('should select a node', () => {
      const selected = nodeManager.selectNode('node1')

      expect(selected).toBe(true)
      expect(nodeManager.isNodeSelected('node1')).toBe(true)
      expect(nodeManager.getNode('node1')?.isSelected).toBe(true)
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node:selected',
          data: expect.objectContaining({
            nodeId: 'node1',
          }),
        })
      )
    })

    it('should deselect a node', () => {
      nodeManager.selectNode('node1')
      eventSpy.mockClear()

      const deselected = nodeManager.deselectNode('node1')

      expect(deselected).toBe(true)
      expect(nodeManager.isNodeSelected('node1')).toBe(false)
      expect(nodeManager.getNode('node1')?.isSelected).toBe(false)
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node:deselected',
        })
      )
    })

    it('should select multiple nodes', () => {
      const selectedIds = nodeManager.selectNodes(['node1', 'node2'])

      expect(selectedIds).toEqual(['node1', 'node2'])
      expect(nodeManager.getSelectedNodeIds()).toEqual(['node1', 'node2'])
    })

    it('should clear all selections', () => {
      nodeManager.selectNodes(['node1', 'node2'])
      nodeManager.clearSelection()

      expect(nodeManager.getSelectedNodeIds()).toHaveLength(0)
      expect(nodeManager.getNode('node1')?.isSelected).toBe(false)
      expect(nodeManager.getNode('node2')?.isSelected).toBe(false)
    })
  })

  describe('Utility Methods', () => {
    beforeEach(() => {
      nodeManager.createNode({
        id: 'node1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: {},
      })
      nodeManager.createNode({
        id: 'node2',
        type: 'default',
        position: { x: 200, y: 200 },
        data: {},
      })
    })

    it('should clear all nodes', () => {
      nodeManager.clear()

      expect(nodeManager.getNodeCount()).toBe(0)
      expect(nodeManager.getSelectedNodeIds()).toHaveLength(0)
    })

    it('should get nodes in area', () => {
      const nodesInArea = nodeManager.getNodesInArea({
        x: -10,
        y: -10,
        width: 150,
        height: 150,
      })

      expect(nodesInArea).toHaveLength(1)
      expect(nodesInArea[0].id).toBe('node1')
    })
  })
})
