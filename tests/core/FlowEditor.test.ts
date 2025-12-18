// Comprehensive tests for FlowEditor class

import { FlowEditor } from '../../src/core/FlowEditor'
import { NodeData, EdgeData } from '../../src/types'

describe('FlowEditor', () => {
  let container: HTMLElement
  let editor: FlowEditor

  beforeEach(() => {
    container = document.createElement('div')
    container.style.width = '800px'
    container.style.height = '600px'
    document.body.appendChild(container)

    editor = new FlowEditor(container)
  })

  afterEach(() => {
    if (editor) {
      editor.destroy()
    }
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  })

  describe('initialization', () => {
    it('should create FlowEditor instance with container', () => {
      expect(editor).toBeInstanceOf(FlowEditor)
      expect(editor.container).toBe(container)
    })

    it('should initialize with default options', () => {
      const editorWithDefaults = new FlowEditor(container)
      expect(editorWithDefaults).toBeInstanceOf(FlowEditor)
      // In test environment, container dimensions might be 0, so we check for the fallback or actual values
      expect(editorWithDefaults.options.width).toBeGreaterThanOrEqual(0)
      expect(editorWithDefaults.options.height).toBeGreaterThanOrEqual(0)
      expect(editorWithDefaults.options.background).toBe('#ffffff')
      expect(editorWithDefaults.options.grid).toBe(true)
      editorWithDefaults.destroy()
    })

    it('should accept custom options', () => {
      const customEditor = new FlowEditor(container, {
        background: '#f0f0f0',
        grid: false,
        minimap: true,
        width: 1000,
        height: 800,
      })
      expect(customEditor).toBeInstanceOf(FlowEditor)
      expect(customEditor.options.background).toBe('#f0f0f0')
      expect(customEditor.options.grid).toBe(false)
      expect(customEditor.options.minimap).toBe(true)
      expect(customEditor.options.width).toBe(1000)
      expect(customEditor.options.height).toBe(800)
      customEditor.destroy()
    })
  })

  describe('node operations', () => {
    it('should have node management methods', () => {
      expect(typeof editor.addNode).toBe('function')
      expect(typeof editor.removeNode).toBe('function')
      expect(typeof editor.getNode).toBe('function')
      expect(typeof editor.getAllNodes).toBe('function')
      expect(typeof editor.updateNode).toBe('function')
      expect(typeof editor.selectNode).toBe('function')
      expect(typeof editor.deselectNode).toBe('function')
      expect(typeof editor.getSelectedNodes).toBe('function')
    })

    it('should return empty array for getAllNodes initially', () => {
      expect(editor.getAllNodes()).toEqual([])
    })

    it('should return null for non-existent node', () => {
      expect(editor.getNode('non-existent')).toBeNull()
    })

    it('should create and manage nodes', () => {
      const nodeData: NodeData = {
        id: 'test-node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Test Node' },
      }

      const node = editor.addNode(nodeData)
      expect(node).toBeDefined()
      expect(node.id).toBe('test-node-1')
      expect(editor.getAllNodes()).toHaveLength(1)
      expect(editor.getNode('test-node-1')).toBe(node)
    })

    it('should remove nodes', () => {
      const nodeData: NodeData = {
        id: 'test-node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Test Node' },
      }

      editor.addNode(nodeData)
      expect(editor.getAllNodes()).toHaveLength(1)

      const removed = editor.removeNode('test-node-1')
      expect(removed).toBe(true)
      expect(editor.getAllNodes()).toHaveLength(0)
      expect(editor.getNode('test-node-1')).toBeNull()
    })

    it('should handle node selection', () => {
      const nodeData: NodeData = {
        id: 'test-node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Test Node' },
      }

      const node = editor.addNode(nodeData)
      expect(editor.getSelectedNodes()).toHaveLength(0)

      editor.selectNode('test-node-1')
      expect(editor.getSelectedNodes()).toHaveLength(1)
      expect(node.isSelected).toBe(true)

      editor.deselectNode('test-node-1')
      expect(editor.getSelectedNodes()).toHaveLength(0)
      expect(node.isSelected).toBe(false)
    })
  })

  describe('edge operations', () => {
    beforeEach(() => {
      // Create source node with output port
      editor.addNode({
        id: 'source-node',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Source' },
        ports: [
          {
            id: 'output-1',
            type: 'output',
            position: 'right',
          },
        ],
      })

      // Create target node with input port
      editor.addNode({
        id: 'target-node',
        type: 'default',
        position: { x: 300, y: 100 },
        data: { label: 'Target' },
        ports: [
          {
            id: 'input-1',
            type: 'input',
            position: 'left',
          },
        ],
      })
    })

    it('should have edge management methods', () => {
      expect(typeof editor.addEdge).toBe('function')
      expect(typeof editor.removeEdge).toBe('function')
      expect(typeof editor.getEdge).toBe('function')
      expect(typeof editor.getAllEdges).toBe('function')
      expect(typeof editor.updateEdge).toBe('function')
      expect(typeof editor.selectEdge).toBe('function')
      expect(typeof editor.deselectEdge).toBe('function')
      expect(typeof editor.getSelectedEdges).toBe('function')
      expect(typeof editor.canConnect).toBe('function')
    })

    it('should return empty array for getAllEdges initially', () => {
      expect(editor.getAllEdges()).toEqual([])
    })

    it('should return null for non-existent edge', () => {
      expect(editor.getEdge('non-existent')).toBeNull()
    })

    it('should create and manage edges', () => {
      const edgeData: EdgeData = {
        id: 'test-edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }

      const edge = editor.addEdge(edgeData)
      expect(edge).toBeDefined()
      expect(edge.id).toBe('test-edge-1')
      expect(editor.getAllEdges()).toHaveLength(1)
      expect(editor.getEdge('test-edge-1')).toBe(edge)
    })

    it('should validate connections', () => {
      const canConnect = editor.canConnect(
        'source-node',
        'output-1',
        'target-node',
        'input-1'
      )
      expect(canConnect.canConnect).toBe(true)

      const cannotConnect = editor.canConnect(
        'source-node',
        'non-existent-port',
        'target-node',
        'input-1'
      )
      expect(cannotConnect.canConnect).toBe(false)
      expect(cannotConnect.reason).toContain('not found')
    })

    it('should remove edges', () => {
      const edgeData: EdgeData = {
        id: 'test-edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }

      editor.addEdge(edgeData)
      expect(editor.getAllEdges()).toHaveLength(1)

      const removed = editor.removeEdge('test-edge-1')
      expect(removed).toBe(true)
      expect(editor.getAllEdges()).toHaveLength(0)
      expect(editor.getEdge('test-edge-1')).toBeNull()
    })

    it('should handle edge selection', () => {
      const edgeData: EdgeData = {
        id: 'test-edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }

      const edge = editor.addEdge(edgeData)
      expect(editor.getSelectedEdges()).toHaveLength(0)

      editor.selectEdge('test-edge-1')
      expect(editor.getSelectedEdges()).toHaveLength(1)
      expect(edge.isSelected).toBe(true)

      editor.deselectEdge('test-edge-1')
      expect(editor.getSelectedEdges()).toHaveLength(0)
      expect(edge.isSelected).toBe(false)
    })

    it('should remove connected edges when node is deleted', () => {
      const edgeData: EdgeData = {
        id: 'test-edge-1',
        source: 'source-node',
        sourcePort: 'output-1',
        target: 'target-node',
        targetPort: 'input-1',
      }

      editor.addEdge(edgeData)
      expect(editor.getAllEdges()).toHaveLength(1)

      // Remove source node - should also remove connected edge
      editor.removeNode('source-node')
      expect(editor.getAllEdges()).toHaveLength(0)
    })
  })

  describe('view control', () => {
    it('should have view control methods', () => {
      expect(typeof editor.zoomTo).toBe('function')
      expect(typeof editor.zoomIn).toBe('function')
      expect(typeof editor.zoomOut).toBe('function')
      expect(typeof editor.resetZoom).toBe('function')
      expect(typeof editor.panTo).toBe('function')
      expect(typeof editor.panBy).toBe('function')
      expect(typeof editor.centerView).toBe('function')
      expect(typeof editor.fitView).toBe('function')
      expect(typeof editor.getViewport).toBe('function')
      expect(typeof editor.setViewport).toBe('function')
      expect(typeof editor.screenToWorld).toBe('function')
      expect(typeof editor.worldToScreen).toBe('function')
    })

    it('should manage viewport state', () => {
      const initialViewport = editor.getViewport()
      expect(initialViewport.x).toBe(0)
      expect(initialViewport.y).toBe(0)
      expect(initialViewport.zoom).toBe(1.0)

      editor.zoomTo(2.0)
      const zoomedViewport = editor.getViewport()
      expect(zoomedViewport.zoom).toBe(2.0)

      editor.panTo(100, 50)
      const pannedViewport = editor.getViewport()
      expect(pannedViewport.x).toBe(100)
      expect(pannedViewport.y).toBe(50)
    })

    it('should handle coordinate transformations', () => {
      const worldPoint = { x: 100, y: 100 }
      const screenPoint = editor.worldToScreen(worldPoint)
      const backToWorld = editor.screenToWorld(screenPoint)

      expect(backToWorld.x).toBeCloseTo(worldPoint.x)
      expect(backToWorld.y).toBeCloseTo(worldPoint.y)
    })
  })

  describe('event system', () => {
    it('should have event management methods', () => {
      expect(typeof editor.on).toBe('function')
      expect(typeof editor.once).toBe('function')
      expect(typeof editor.off).toBe('function')
      expect(typeof editor.removeAllListeners).toBe('function')
      expect(typeof editor.emit).toBe('function')
      expect(typeof editor.getListenerCount).toBe('function')
      expect(typeof editor.hasListeners).toBe('function')
      expect(typeof editor.getEventHistory).toBe('function')
      expect(typeof editor.clearEventHistory).toBe('function')
      expect(typeof editor.getEventStats).toBe('function')
    })

    it('should handle event listeners', () => {
      let eventReceived = false
      const eventHandler = () => {
        eventReceived = true
      }

      editor.on('test:event', eventHandler)
      expect(editor.hasListeners('test:event')).toBe(true)
      expect(editor.getListenerCount('test:event')).toBe(1)

      editor.emit('test:event', {
        type: 'test:event',
        timestamp: Date.now(),
        data: {},
      })
      expect(eventReceived).toBe(true)

      editor.off('test:event', eventHandler)
      expect(editor.hasListeners('test:event')).toBe(false)
    })

    it('should handle once listeners', () => {
      let callCount = 0
      const eventHandler = () => {
        callCount++
      }

      editor.once('test:once', eventHandler)
      expect(editor.hasListeners('test:once')).toBe(true)

      editor.emit('test:once', {
        type: 'test:once',
        timestamp: Date.now(),
        data: {},
      })
      expect(callCount).toBe(1)

      // Should not be called again
      editor.emit('test:once', {
        type: 'test:once',
        timestamp: Date.now(),
        data: {},
      })
      expect(callCount).toBe(1)
      expect(editor.hasListeners('test:once')).toBe(false)
    })
  })

  describe('serialization', () => {
    it('should have serialization methods', () => {
      expect(typeof editor.toJSON).toBe('function')
      expect(typeof editor.fromJSON).toBe('function')
    })

    it('should serialize and deserialize workflow state', () => {
      // Create some nodes and edges
      editor.addNode({
        id: 'node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Node 1' },
        ports: [{ id: 'output-1', type: 'output', position: 'right' }],
      })

      editor.addNode({
        id: 'node-2',
        type: 'default',
        position: { x: 300, y: 100 },
        data: { label: 'Node 2' },
        ports: [{ id: 'input-1', type: 'input', position: 'left' }],
      })

      editor.addEdge({
        id: 'edge-1',
        source: 'node-1',
        sourcePort: 'output-1',
        target: 'node-2',
        targetPort: 'input-1',
      })

      // Set viewport
      editor.zoomTo(1.5)
      editor.panTo(50, 25)

      // Serialize
      const jsonString = editor.toJSON()
      expect(jsonString).toBeDefined()
      expect(typeof jsonString).toBe('string')

      // Parse to verify structure
      const flowData = JSON.parse(jsonString)
      expect(flowData.nodes).toHaveLength(2)
      expect(flowData.edges).toHaveLength(1)
      expect(flowData.viewport.zoom).toBe(1.5)
      expect(flowData.viewport.x).toBe(50)
      expect(flowData.viewport.y).toBe(25)

      // Clear current state
      editor.removeEdge('edge-1')
      editor.removeNode('node-1')
      editor.removeNode('node-2')
      editor.resetZoom()
      editor.centerView()

      expect(editor.getAllNodes()).toHaveLength(0)
      expect(editor.getAllEdges()).toHaveLength(0)

      // Deserialize
      editor.fromJSON(jsonString)

      // Verify restored state
      expect(editor.getAllNodes()).toHaveLength(2)
      expect(editor.getAllEdges()).toHaveLength(1)
      expect(editor.getNode('node-1')).toBeDefined()
      expect(editor.getNode('node-2')).toBeDefined()
      expect(editor.getEdge('edge-1')).toBeDefined()

      const restoredViewport = editor.getViewport()
      expect(restoredViewport.zoom).toBe(1.5)
      expect(restoredViewport.x).toBe(50)
      expect(restoredViewport.y).toBe(25)
    })
  })

  describe('interaction system integration', () => {
    it('should have interaction system properties', () => {
      expect(typeof editor.isDragging).toBe('boolean')
      expect(typeof editor.isConnecting).toBe('boolean')
      expect(typeof editor.getInteractionSelectedNodes).toBe('function')
      expect(typeof editor.getInteractionSelectedEdges).toBe('function')
      expect(typeof editor.hasInteractionSelection).toBe('function')
    })

    it('should handle selection clearing', () => {
      const node = editor.addNode({
        id: 'test-node',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Test' },
      })

      editor.selectNode('test-node')
      expect(editor.getSelectedNodes()).toHaveLength(1)

      editor.clearSelection()
      expect(editor.getSelectedNodes()).toHaveLength(0)
      expect(node.isSelected).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle invalid node creation', () => {
      expect(() => {
        editor.addNode({
          id: '',
          type: 'default',
          position: { x: 100, y: 100 },
          data: {},
        })
      }).toThrow()
    })

    it('should handle invalid edge creation', () => {
      expect(() => {
        editor.addEdge({
          id: 'test-edge',
          source: 'non-existent-source',
          sourcePort: 'output',
          target: 'non-existent-target',
          targetPort: 'input',
        })
      }).toThrow()
    })

    it('should handle invalid JSON deserialization', () => {
      expect(() => {
        editor.fromJSON('invalid json')
      }).toThrow()
    })
  })

  describe('cleanup', () => {
    it('should properly destroy and cleanup resources', () => {
      const node = editor.addNode({
        id: 'test-node',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Test' },
      })

      expect(editor.getAllNodes()).toHaveLength(1)
      expect(node.id).toBe('test-node')

      editor.destroy()

      // After destroy, the editor should be cleaned up
      // Note: We can't test much after destroy since the editor is no longer functional
      expect(() => editor.destroy()).not.toThrow() // Should not throw on multiple destroy calls
    })
  })
})
