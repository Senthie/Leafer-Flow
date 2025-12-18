// EdgeManager tests

import { EdgeManager } from '../../src/managers/EdgeManager'
import { FlowNode } from '../../src/components/FlowNode'
import { EdgeData, NodeData } from '../../src/types'
import { FlowError } from '../../src/errors/FlowError'

describe('EdgeManager', () => {
  let edgeManager: EdgeManager
  let sourceNode: FlowNode
  let targetNode: FlowNode

  beforeEach(() => {
    edgeManager = new EdgeManager()

    // Create test nodes with ports
    const sourceNodeData: NodeData = {
      id: 'source-node',
      type: 'default',
      position: { x: 0, y: 0 },
      data: { label: 'Source Node' },
      ports: [
        {
          id: 'output-1',
          type: 'output',
          position: 'right',
          dataType: 'string',
          multiple: true,
        },
        {
          id: 'output-2',
          type: 'output',
          position: 'right',
          dataType: 'number',
          multiple: false,
        },
      ],
    }

    const targetNodeData: NodeData = {
      id: 'target-node',
      type: 'default',
      position: { x: 200, y: 0 },
      data: { label: 'Target Node' },
      ports: [
        {
          id: 'input-1',
          type: 'input',
          position: 'left',
          dataType: 'string',
          multiple: true,
        },
        {
          id: 'input-2',
          type: 'input',
          position: 'left',
          dataType: 'number',
          multiple: false,
        },
      ],
    }

    sourceNode = new FlowNode(sourceNodeData)
    targetNode = new FlowNode(targetNodeData)
  })

  describe('Edge Type Management', () => {
    test('should register and retrieve edge types', () => {
      const edgeType = {
        render: jest.fn(),
        style: { stroke: '#ff0000' },
        validate: jest.fn().mockReturnValue(true),
      }

      edgeManager.registerEdgeType('custom', edgeType)
      expect(edgeManager.getEdgeType('custom')).toBe(edgeType)
    })

    test('should throw error for invalid edge type registration', () => {
      expect(() => {
        edgeManager.registerEdgeType('', {} as any)
      }).toThrow(FlowError)

      expect(() => {
        edgeManager.registerEdgeType('test', null as any)
      }).toThrow(FlowError)
    })

    test('should unregister edge types', () => {
      const edgeType = { render: jest.fn() }
      edgeManager.registerEdgeType('test', edgeType)

      expect(edgeManager.unregisterEdgeType('test')).toBe(true)
      expect(edgeManager.getEdgeType('test')).toBeNull()
      expect(edgeManager.unregisterEdgeType('nonexistent')).toBe(false)
    })

    test('should get all edge types', () => {
      const customType = { render: jest.fn() }
      edgeManager.registerEdgeType('custom', customType)

      const allTypes = edgeManager.getAllEdgeTypes()
      expect(allTypes).toHaveProperty('default')
      expect(allTypes).toHaveProperty('custom')
      expect(allTypes.custom).toBe(customType)
    })
  })

  describe('Edge Creation', () => {
    test('should create valid edge', () => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
        data: { label: 'Test Edge' },
      }

      const edge = edgeManager.createEdge(edgeData, sourceNode, targetNode)

      expect(edge).toBeDefined()
      expect(edge.id).toBe('edge-1')
      expect(edge.source).toBe(sourceNode)
      expect(edge.target).toBe(targetNode)
      expect(edgeManager.hasEdge('edge-1')).toBe(true)
      expect(edgeManager.getEdgeCount()).toBe(1)
    })

    test('should throw error for duplicate edge ID', () => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }

      edgeManager.createEdge(edgeData, sourceNode, targetNode)

      expect(() => {
        edgeManager.createEdge(edgeData, sourceNode, targetNode)
      }).toThrow(FlowError)
    })

    test('should throw error for invalid edge data', () => {
      expect(() => {
        edgeManager.createEdge(null as any, sourceNode, targetNode)
      }).toThrow(FlowError)

      expect(() => {
        edgeManager.createEdge({ id: '' } as any, sourceNode, targetNode)
      }).toThrow(FlowError)

      expect(() => {
        edgeManager.createEdge(
          {
            id: 'edge-1',
            source: 'source-node',
            sourcePort: 'nonexistent',
            target: 'target-node',
            targetPort: 'input-1',
          },
          sourceNode,
          targetNode
        )
      }).toThrow(FlowError)
    })

    test('should throw error for self-connection', () => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'source-node',
        targetPort: 'input-1',
      }

      expect(() => {
        edgeManager.createEdge(edgeData, sourceNode, sourceNode)
      }).toThrow(FlowError)
    })

    test('should handle single connection port replacement', () => {
      // Create first edge to single connection port
      const edgeData1: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-2', // single connection port
        target: 'target-node',
        targetPort: 'input-2', // single connection port
      }

      edgeManager.createEdge(edgeData1, sourceNode, targetNode)
      expect(edgeManager.getEdgeCount()).toBe(1)

      // Create another node with compatible port for second connection
      const anotherTargetNodeData: NodeData = {
        id: 'another-target',
        type: 'default',
        position: { x: 300, y: 0 },
        data: { label: 'Another Target' },
        ports: [
          {
            id: 'input-3',
            type: 'input',
            position: 'left',
            dataType: 'number',
            multiple: false,
          },
        ],
      }
      const anotherTargetNode = new FlowNode(anotherTargetNodeData)

      // Create second edge from same single connection source port - should replace first
      const edgeData2: EdgeData = {
        id: 'edge-2',
        source: 'source-node',
        sourcePort: 'output-2', // same single connection port
        target: 'another-target',
        targetPort: 'input-3', // different node and port
      }

      edgeManager.createEdge(edgeData2, sourceNode, anotherTargetNode)
      expect(edgeManager.getEdgeCount()).toBe(1)
      expect(edgeManager.hasEdge('edge-1')).toBe(false)
      expect(edgeManager.hasEdge('edge-2')).toBe(true)
    })
  })

  describe('Edge Retrieval', () => {
    beforeEach(() => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }
      edgeManager.createEdge(edgeData, sourceNode, targetNode)
    })

    test('should get edge by ID', () => {
      const edge = edgeManager.getEdge('edge-1')
      expect(edge).toBeDefined()
      expect(edge!.id).toBe('edge-1')

      expect(edgeManager.getEdge('nonexistent')).toBeNull()
    })

    test('should get all edges', () => {
      const edges = edgeManager.getAllEdges()
      expect(edges).toHaveLength(1)
      expect(edges[0].id).toBe('edge-1')
    })

    test('should get edges by node', () => {
      const sourceEdges = edgeManager.getEdgesByNode('source-node')
      const targetEdges = edgeManager.getEdgesByNode('target-node')
      const nonexistentEdges = edgeManager.getEdgesByNode('nonexistent')

      expect(sourceEdges).toHaveLength(1)
      expect(targetEdges).toHaveLength(1)
      expect(nonexistentEdges).toHaveLength(0)
    })

    test('should get edges by port', () => {
      const sourcePortEdges = edgeManager.getEdgesByPort(
        'source-node',
        'output-1'
      )
      const targetPortEdges = edgeManager.getEdgesByPort(
        'target-node',
        'input-1'
      )
      const nonexistentPortEdges = edgeManager.getEdgesByPort(
        'source-node',
        'nonexistent'
      )

      expect(sourcePortEdges).toHaveLength(1)
      expect(targetPortEdges).toHaveLength(1)
      expect(nonexistentPortEdges).toHaveLength(0)
    })
  })

  describe('Edge Update', () => {
    let edgeId: string

    beforeEach(() => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
        data: { label: 'Original' },
      }
      edgeManager.createEdge(edgeData, sourceNode, targetNode)
      edgeId = 'edge-1'
    })

    test('should update edge data', () => {
      const updates = {
        data: { label: 'Updated', color: 'red' },
      }

      const updatedEdge = edgeManager.updateEdge(edgeId, updates)
      expect(updatedEdge.edgeData.label).toBe('Updated')
      expect(updatedEdge.edgeData.color).toBe('red')
    })

    test('should throw error for nonexistent edge', () => {
      expect(() => {
        edgeManager.updateEdge('nonexistent', { data: {} })
      }).toThrow(FlowError)
    })
  })

  describe('Edge Deletion', () => {
    beforeEach(() => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }
      edgeManager.createEdge(edgeData, sourceNode, targetNode)
    })

    test('should delete edge', () => {
      expect(edgeManager.deleteEdge('edge-1')).toBe(true)
      expect(edgeManager.hasEdge('edge-1')).toBe(false)
      expect(edgeManager.getEdgeCount()).toBe(0)
    })

    test('should return false for nonexistent edge deletion', () => {
      expect(edgeManager.deleteEdge('nonexistent')).toBe(false)
    })

    test('should delete edges by node', () => {
      // Create another edge with different ports to avoid duplicate connection error
      const edgeData2: EdgeData = {
        id: 'edge-2',
        source: 'source-node',
        sourcePort: 'output-2', // different port
        target: 'target-node',
        targetPort: 'input-2', // different port
      }
      edgeManager.createEdge(edgeData2, sourceNode, targetNode)

      const deletedIds = edgeManager.deleteEdgesByNode('source-node')
      expect(deletedIds).toHaveLength(2)
      expect(edgeManager.getEdgeCount()).toBe(0)
    })
  })

  describe('Connection Validation', () => {
    test('should validate compatible connections', () => {
      const result = edgeManager.canConnect(
        sourceNode,
        'output-1',
        targetNode,
        'input-1'
      )
      expect(result.canConnect).toBe(true)
    })

    test('should reject incompatible data types', () => {
      const result = edgeManager.canConnect(
        sourceNode,
        'output-1', // string type
        targetNode,
        'input-2' // number type
      )
      expect(result.canConnect).toBe(false)
      expect(result.reason).toContain('incompatible')
    })

    test('should reject connection to occupied single connection port', () => {
      // Create first connection
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-2', // number type
        target: 'target-node',
        targetPort: 'input-2', // single connection port, number type
      }
      edgeManager.createEdge(edgeData, sourceNode, targetNode)

      // Try to create second connection to same single connection port
      const result = edgeManager.canConnect(
        sourceNode,
        'output-2', // same source port (single connection)
        targetNode,
        'input-2' // already occupied single connection port
      )
      expect(result.canConnect).toBe(false)
      expect(result.reason).toContain('already has a connection')
    })

    test('should find existing edge between ports', () => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }
      edgeManager.createEdge(edgeData, sourceNode, targetNode)

      const foundEdge = edgeManager.findEdgeBetweenPorts(
        'source-node',
        'output-1',
        'target-node',
        'input-1'
      )
      expect(foundEdge).toBeDefined()
      expect(foundEdge!.id).toBe('edge-1')

      const notFoundEdge = edgeManager.findEdgeBetweenPorts(
        'source-node',
        'output-2',
        'target-node',
        'input-2'
      )
      expect(notFoundEdge).toBeNull()
    })
  })

  describe('Batch Operations', () => {
    test('should create multiple edges', () => {
      const edgesData = [
        {
          edgeData: {
            id: 'edge-1',
            source: 'source-node',
            sourcePort: 'output-1',
            target: 'target-node',
            targetPort: 'input-1',
          },
          sourceNode,
          targetNode,
        },
      ]

      const createdEdges = edgeManager.createEdges(edgesData)
      expect(createdEdges).toHaveLength(1)
      expect(edgeManager.getEdgeCount()).toBe(1)
    })

    test('should delete multiple edges', () => {
      // Create test edges
      const edgeData1: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }
      const edgeData2: EdgeData = {
        id: 'edge-2',
        source: 'source-node',
        sourcePort: 'output-2', // different port
        target: 'target-node',
        targetPort: 'input-2', // different port
      }

      edgeManager.createEdge(edgeData1, sourceNode, targetNode)
      edgeManager.createEdge(edgeData2, sourceNode, targetNode)

      const deletedIds = edgeManager.deleteEdges([
        'edge-1',
        'edge-2',
        'nonexistent',
      ])
      expect(deletedIds).toEqual(['edge-1', 'edge-2'])
      expect(edgeManager.getEdgeCount()).toBe(0)
    })
  })

  describe('Selection Management', () => {
    beforeEach(() => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }
      edgeManager.createEdge(edgeData, sourceNode, targetNode)
    })

    test('should select and deselect edges', () => {
      expect(edgeManager.selectEdge('edge-1')).toBe(true)
      expect(edgeManager.isEdgeSelected('edge-1')).toBe(true)
      expect(edgeManager.getSelectedEdgeIds()).toEqual(['edge-1'])

      expect(edgeManager.deselectEdge('edge-1')).toBe(true)
      expect(edgeManager.isEdgeSelected('edge-1')).toBe(false)
      expect(edgeManager.getSelectedEdgeIds()).toEqual([])
    })

    test('should handle selection of nonexistent edges', () => {
      expect(edgeManager.selectEdge('nonexistent')).toBe(false)
      expect(edgeManager.deselectEdge('nonexistent')).toBe(false)
    })

    test('should clear all selections', () => {
      edgeManager.selectEdge('edge-1')
      expect(edgeManager.getSelectedEdgeIds()).toHaveLength(1)

      edgeManager.clearSelection()
      expect(edgeManager.getSelectedEdgeIds()).toHaveLength(0)
    })

    test('should get selected edges', () => {
      edgeManager.selectEdge('edge-1')
      const selectedEdges = edgeManager.getSelectedEdges()
      expect(selectedEdges).toHaveLength(1)
      expect(selectedEdges[0].id).toBe('edge-1')
    })
  })

  describe('Utility Methods', () => {
    beforeEach(() => {
      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }
      edgeManager.createEdge(edgeData, sourceNode, targetNode)
    })

    test('should clear all edges', () => {
      expect(edgeManager.getEdgeCount()).toBe(1)
      edgeManager.clear()
      expect(edgeManager.getEdgeCount()).toBe(0)
    })

    test('should update edge positions', () => {
      const edge = edgeManager.getEdge('edge-1')!
      const updatePathSpy = jest.spyOn(edge, 'updateForNodeMovement')

      edgeManager.updateEdgePositions()
      expect(updatePathSpy).toHaveBeenCalled()
    })
  })

  describe('Event Handling', () => {
    test('should emit events for edge operations', () => {
      const eventHandler = jest.fn()
      const edgeManagerWithEvents = new EdgeManager({ onEvent: eventHandler })

      const edgeData: EdgeData = {
        id: 'edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }

      // Test creation event
      edgeManagerWithEvents.createEdge(edgeData, sourceNode, targetNode)
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'edge:created',
          data: expect.objectContaining({ edgeId: 'edge-1' }),
        })
      )

      // Test selection event
      edgeManagerWithEvents.selectEdge('edge-1')
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'edge:selected',
          data: expect.objectContaining({ edgeId: 'edge-1' }),
        })
      )

      // Test update event
      edgeManagerWithEvents.updateEdge('edge-1', { data: { updated: true } })
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'edge:updated',
          data: expect.objectContaining({ edgeId: 'edge-1' }),
        })
      )

      // Test deletion event
      edgeManagerWithEvents.deleteEdge('edge-1')
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'edge:deleted',
          data: expect.objectContaining({ edgeId: 'edge-1' }),
        })
      )
    })
  })
})
