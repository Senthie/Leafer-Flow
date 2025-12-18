// Advanced Features Demo - showcases the new functionality in task 13

import { FlowEditor } from '../src/core/FlowEditor'
import { NodeData, EdgeData } from '../src/types'

// Create a container element (in a real app, this would be a DOM element)
const container = document.createElement('div')
container.style.width = '800px'
container.style.height = '600px'

// Initialize FlowEditor with advanced options
const editor = new FlowEditor(container, {
  // Basic options
  background: '#f5f5f5',
  grid: true,

  // Advanced options
  enableHistory: true,
  maxHistorySize: 50,
  enablePerformanceOptimization: true,
  maxVisibleNodes: 500,
  maxVisibleEdges: 1000,
  enableLevelOfDetail: true,
  lodThreshold: 0.3,

  // Custom node types
  nodeTypes: {
    'custom-process': {
      render: node => node, // Would use custom renderer
      defaultData: { label: 'Custom Process', color: '#4CAF50' },
      getSize: () => ({ width: 150, height: 80 }),
    },
    'custom-decision': {
      render: node => node, // Would use custom renderer
      defaultData: { label: 'Decision Point', color: '#FF9800' },
      getSize: () => ({ width: 120, height: 80 }),
    },
  },

  // Custom edge types
  edgeTypes: {
    'data-flow': {
      render: edge => edge, // Would use custom renderer
      pathType: 'bezier',
      animated: true,
      style: { stroke: '#2196F3', strokeWidth: 3 },
    },
    'control-flow': {
      render: edge => edge, // Would use custom renderer
      pathType: 'orthogonal',
      style: { stroke: '#9C27B0', strokeWidth: 2, strokeDasharray: '5,5' },
    },
  },
})

// Demo 1: Custom Node Rendering
console.log('=== Demo 1: Custom Node Types ===')

// Register custom node renderers
editor.registerNodeRenderer('process', {
  render: context => {
    console.log('Rendering custom process node:', context.node.id)
    // In a real implementation, this would return a custom LeaferJS Group
    return context.node
  },
  getSize: () => ({ width: 140, height: 80 }),
})

editor.registerNodeRenderer('decision', {
  render: context => {
    console.log('Rendering custom decision node:', context.node.id)
    // In a real implementation, this would return a diamond-shaped node
    return context.node
  },
  getSize: () => ({ width: 120, height: 80 }),
})

// Create nodes with custom types
const processNode: NodeData = {
  id: 'process-1',
  type: 'process',
  position: { x: 100, y: 100 },
  data: { label: 'Data Processing', description: 'Processes incoming data' },
  ports: [
    { id: 'input', type: 'input', position: 'left' },
    { id: 'output', type: 'output', position: 'right' },
  ],
}

const decisionNode: NodeData = {
  id: 'decision-1',
  type: 'decision',
  position: { x: 300, y: 100 },
  data: { label: 'Valid Data?', condition: 'data.isValid' },
  ports: [
    { id: 'input', type: 'input', position: 'left' },
    { id: 'yes', type: 'output', position: 'top' },
    { id: 'no', type: 'output', position: 'bottom' },
  ],
}

editor.addNode(processNode)
editor.addNode(decisionNode)

// Demo 2: Custom Edge Rendering
console.log('=== Demo 2: Custom Edge Types ===')

// Register custom edge renderers
editor.registerEdgeRenderer('dashed', {
  render: context => {
    console.log('Rendering dashed edge:', context.edge.id)
    // In a real implementation, this would return a custom styled edge
    return context.edge
  },
})

editor.registerEdgeRenderer('thick', {
  render: context => {
    console.log('Rendering thick edge:', context.edge.id)
    // In a real implementation, this would return a thick edge
    return context.edge
  },
})

// Create edges with custom types
const dataEdge: EdgeData = {
  id: 'data-edge-1',
  source: 'process-1',
  sourcePort: 'output',
  target: 'decision-1',
  targetPort: 'input',
  data: { type: 'dashed', label: 'Data Flow' },
}

editor.addEdge(dataEdge)

// Demo 3: Undo/Redo Functionality
console.log('=== Demo 3: Undo/Redo System ===')

console.log('History stats before operations:', editor.getHistoryStats())

// Perform some operations
const tempNode: NodeData = {
  id: 'temp-node',
  type: 'default',
  position: { x: 500, y: 200 },
  data: { label: 'Temporary Node' },
}

editor.addNode(tempNode)
console.log('Added temp node. Can undo:', editor.canUndo())

editor.removeNode('temp-node')
console.log('Removed temp node. Can undo:', editor.canUndo())

// Undo the removal
editor.undo()
console.log('Undid removal. Node exists:', !!editor.getNode('temp-node'))

// Redo the removal
editor.redo()
console.log('Redid removal. Node exists:', !!editor.getNode('temp-node'))

console.log('Final history stats:', editor.getHistoryStats())

// Demo 4: Performance Optimization
console.log('=== Demo 4: Performance Optimization ===')

// Create many nodes to test performance features
const nodes: NodeData[] = []
for (let i = 0; i < 100; i++) {
  nodes.push({
    id: `perf-node-${i}`,
    type: 'default',
    position: {
      x: (i % 10) * 150,
      y: Math.floor(i / 10) * 100,
    },
    data: { label: `Node ${i}` },
  })
}

// Batch create nodes for better performance
await editor.batchOperation(
  nodes,
  nodeData => editor.addNode(nodeData),
  (completed, total) => {
    if (completed % 20 === 0) {
      console.log(`Created ${completed}/${total} nodes`)
    }
  }
)

console.log('Performance stats:', editor.getPerformanceStats())

// Update visibility based on viewport
const visibility = editor.updateVisibility()
console.log('Visibility update:', {
  visibleNodes: visibility.visibleNodes.length,
  hiddenNodes: visibility.hiddenNodes.length,
  visibleEdges: visibility.visibleEdges.length,
  hiddenEdges: visibility.hiddenEdges.length,
})

// Apply level of detail
editor.applyLevelOfDetail()
console.log('Applied level of detail based on zoom level')

// Demo 5: Advanced Edge Path Generation
console.log('=== Demo 5: Advanced Edge Paths ===')

const sourcePos = { x: 100, y: 100 }
const targetPos = { x: 300, y: 200 }

const bezierPath = editor.generateEdgePath(sourcePos, targetPos, 'bezier')
const straightPath = editor.generateEdgePath(sourcePos, targetPos, 'straight')
const orthogonalPath = editor.generateEdgePath(
  sourcePos,
  targetPos,
  'orthogonal'
)
const smoothStepPath = editor.generateEdgePath(
  sourcePos,
  targetPos,
  'smooth-step'
)

console.log('Generated paths:')
console.log('Bezier:', bezierPath)
console.log('Straight:', straightPath)
console.log('Orthogonal:', orthogonalPath)
console.log('Smooth Step:', smoothStepPath)

// Demo 6: Event System Integration
console.log('=== Demo 6: Event System Integration ===')

// Listen to advanced events
editor.on('node:created', event => {
  console.log(
    'Advanced: Node created with history tracking:',
    event.data.nodeId
  )
})

editor.on('viewport:changed', event => {
  console.log(
    'Advanced: Viewport changed, applying LOD:',
    event.data.viewport.zoom
  )
  editor.applyLevelOfDetail()
})

// Create a node to trigger events
const eventTestNode: NodeData = {
  id: 'event-test',
  type: 'default',
  position: { x: 600, y: 300 },
  data: { label: 'Event Test' },
}

editor.addNode(eventTestNode)

// Change viewport to trigger LOD
editor.zoomTo(0.3) // Below LOD threshold

console.log('=== Advanced Features Demo Complete ===')
console.log('All advanced features have been demonstrated:')
console.log('✓ Custom node type rendering')
console.log('✓ Custom edge type styling')
console.log('✓ Undo/Redo functionality')
console.log('✓ Performance optimization for large node counts')
console.log('✓ Level of detail rendering')
console.log('✓ Batch operations')
console.log('✓ Advanced edge path generation')
console.log('✓ Enhanced event system integration')

// Cleanup
editor.destroy()
