// InteractionSystem tests

import { InteractionSystem } from '../../src/systems/InteractionSystem'
import { FlowNode } from '../../src/components/FlowNode'
import { FlowEdge } from '../../src/components/FlowEdge'
import { NodeData, EdgeData } from '../../src/types'

// Mock DOM elements
const mockContainer = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as unknown as HTMLElement

// Mock document methods
const originalAddEventListener = document.addEventListener
const originalRemoveEventListener = document.removeEventListener

beforeAll(() => {
  document.addEventListener = jest.fn()
  document.removeEventListener = jest.fn()
})

afterAll(() => {
  document.addEventListener = originalAddEventListener
  document.removeEventListener = originalRemoveEventListener
})

describe('InteractionSystem', () => {
  let interactionSystem: InteractionSystem
  let mockEventHandler: jest.Mock
  let testNode1: FlowNode
  let testNode2: FlowNode
  let testEdge: FlowEdge

  beforeEach(() => {
    mockEventHandler = jest.fn()

    interactionSystem = new InteractionSystem({
      onEvent: mockEventHandler,
    })

    // Create test nodes
    const nodeData1: NodeData = {
      id: 'node1',
      type: 'test',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node 1' },
      ports: [{ id: 'port1', type: 'output', position: 'right' }],
    }

    const nodeData2: NodeData = {
      id: 'node2',
      type: 'test',
      position: { x: 300, y: 200 },
      data: { label: 'Test Node 2' },
      ports: [{ id: 'port2', type: 'input', position: 'left' }],
    }

    testNode1 = new FlowNode(nodeData1)
    testNode2 = new FlowNode(nodeData2)

    // Create test edge
    const edgeData: EdgeData = {
      id: 'edge1',
      source: 'node1',
      sourcePort: 'port1',
      target: 'node2',
      targetPort: 'port2',
    }

    const sourcePort = testNode1.getPort('port1')!
    const targetPort = testNode2.getPort('port2')!
    testEdge = new FlowEdge(
      edgeData,
      testNode1,
      sourcePort,
      testNode2,
      targetPort
    )

    interactionSystem.initialize(mockContainer)
  })

  afterEach(() => {
    interactionSystem.destroy()
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with container', () => {
      expect(mockContainer.addEventListener).toHaveBeenCalled()
      expect(document.addEventListener).toHaveBeenCalled()
    })

    it('should clean up event listeners on destroy', () => {
      interactionSystem.destroy()
      expect(mockContainer.removeEventListener).toHaveBeenCalled()
      expect(document.removeEventListener).toHaveBeenCalled()
    })
  })

  describe('Node Selection', () => {
    it('should select a node', () => {
      interactionSystem.selectNode(testNode1)

      expect(testNode1.isSelected).toBe(true)
      expect(interactionSystem.getSelectedNodes()).toContain(testNode1)
      expect(interactionSystem.hasSelection()).toBe(true)
    })

    it('should deselect a node', () => {
      interactionSystem.selectNode(testNode1)
      interactionSystem.deselectNode(testNode1)

      expect(testNode1.isSelected).toBe(false)
      expect(interactionSystem.getSelectedNodes()).not.toContain(testNode1)
      expect(interactionSystem.hasSelection()).toBe(false)
    })

    it('should select multiple nodes', () => {
      interactionSystem.selectNode(testNode1)
      interactionSystem.selectNode(testNode2)

      expect(testNode1.isSelected).toBe(true)
      expect(testNode2.isSelected).toBe(true)
      expect(interactionSystem.getSelectedNodes()).toHaveLength(2)
    })

    it('should clear all selections', () => {
      interactionSystem.selectNode(testNode1)
      interactionSystem.selectNode(testNode2)
      interactionSystem.selectEdge(testEdge)

      interactionSystem.clearSelection()

      expect(testNode1.isSelected).toBe(false)
      expect(testNode2.isSelected).toBe(false)
      expect(testEdge.isSelected).toBe(false)
      expect(interactionSystem.hasSelection()).toBe(false)
    })
  })

  describe('Edge Selection', () => {
    it('should select an edge', () => {
      interactionSystem.selectEdge(testEdge)

      expect(testEdge.isSelected).toBe(true)
      expect(interactionSystem.getSelectedEdges()).toContain(testEdge)
      expect(interactionSystem.hasSelection()).toBe(true)
    })

    it('should deselect an edge', () => {
      interactionSystem.selectEdge(testEdge)
      interactionSystem.deselectEdge(testEdge)

      expect(testEdge.isSelected).toBe(false)
      expect(interactionSystem.getSelectedEdges()).not.toContain(testEdge)
      expect(interactionSystem.hasSelection()).toBe(false)
    })
  })

  describe('Drag State', () => {
    it('should start with no drag state', () => {
      expect(interactionSystem.isDragging).toBe(false)
    })

    it('should track connection state', () => {
      expect(interactionSystem.isConnecting).toBe(false)
    })
  })

  describe('Delete Selected', () => {
    it('should emit delete event for selected elements', () => {
      interactionSystem.selectNode(testNode1)
      interactionSystem.selectEdge(testEdge)

      interactionSystem.deleteSelected()

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selection:delete',
          data: expect.objectContaining({
            nodeIds: ['node1'],
            edgeIds: ['edge1'],
          }),
        })
      )
    })

    it('should not emit delete event when nothing is selected', () => {
      interactionSystem.deleteSelected()

      expect(mockEventHandler).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selection:delete',
        })
      )
    })
  })

  describe('Select All', () => {
    it('should select all nodes and edges when callbacks are provided', () => {
      const getAllNodes = jest.fn().mockReturnValue([testNode1, testNode2])
      const getAllEdges = jest.fn().mockReturnValue([testEdge])

      const systemWithCallbacks = new InteractionSystem({
        onEvent: mockEventHandler,
        getAllNodes,
        getAllEdges,
      })

      systemWithCallbacks.initialize(mockContainer)
      systemWithCallbacks.selectAll()

      expect(testNode1.isSelected).toBe(true)
      expect(testNode2.isSelected).toBe(true)
      expect(testEdge.isSelected).toBe(true)

      systemWithCallbacks.destroy()
    })
  })
})
