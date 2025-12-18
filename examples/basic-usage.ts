/**
 * Basic Usage Example
 *
 * This example demonstrates the fundamental features of Leafer-Flow:
 * - Creating a flow editor
 * - Adding nodes with ports
 * - Creating connections between nodes
 * - Basic event handling
 */

import { FlowEditor } from '../src/core/FlowEditor'
import { NodeData, EdgeData } from '../src/types'

// Create a container element
const container =
  document.getElementById('flow-container') || document.createElement('div')
container.style.width = '800px'
container.style.height = '600px'

// Initialize the flow editor
const editor = new FlowEditor(container, {
  background: '#f8f9fa',
  grid: true,
  controls: true,
  minimap: false,
})

// Example 1: Creating basic nodes
console.log('=== Example 1: Creating Basic Nodes ===')

const startNode: NodeData = {
  id: 'start-node',
  type: 'default',
  position: { x: 100, y: 150 },
  data: {
    label: '开始',
    description: '工作流开始节点',
  },
  ports: [
    {
      id: 'start-output',
      type: 'output',
      position: 'right',
      dataType: 'any',
    },
  ],
}

const processNode: NodeData = {
  id: 'process-node',
  type: 'default',
  position: { x: 300, y: 150 },
  data: {
    label: '处理数据',
    description: '数据处理节点',
  },
  ports: [
    {
      id: 'process-input',
      type: 'input',
      position: 'left',
      dataType: 'any',
    },
    {
      id: 'process-output',
      type: 'output',
      position: 'right',
      dataType: 'processed',
    },
  ],
}

const endNode: NodeData = {
  id: 'end-node',
  type: 'default',
  position: { x: 500, y: 150 },
  data: {
    label: '结束',
    description: '工作流结束节点',
  },
  ports: [
    {
      id: 'end-input',
      type: 'input',
      position: 'left',
      dataType: 'processed',
    },
  ],
}

// Add nodes to the editor
const startNodeInstance = editor.addNode(startNode)
const processNodeInstance = editor.addNode(processNode)
const endNodeInstance = editor.addNode(endNode)

console.log('Created nodes:', {
  start: startNodeInstance.id,
  process: processNodeInstance.id,
  end: endNodeInstance.id,
})

// Example 2: Creating connections
console.log('=== Example 2: Creating Connections ===')

const connection1: EdgeData = {
  id: 'connection-1',
  source: 'start-node',
  sourcePort: 'start-output',
  target: 'process-node',
  targetPort: 'process-input',
}

const connection2: EdgeData = {
  id: 'connection-2',
  source: 'process-node',
  sourcePort: 'process-output',
  target: 'end-node',
  targetPort: 'end-input',
}

const edge1 = editor.addEdge(connection1)
const edge2 = editor.addEdge(connection2)

console.log('Created connections:', {
  edge1: edge1.id,
  edge2: edge2.id,
})

// Example 3: Event handling
console.log('=== Example 3: Event Handling ===')

// Listen to node events
editor.on('node:created', event => {
  console.log('Node created:', event.data.nodeId)
})

editor.on('node:selected', event => {
  console.log('Node selected:', event.data.nodeId)
})

editor.on('node:moved', event => {
  console.log(
    'Node moved:',
    event.data.nodeId,
    'to position:',
    event.data.position
  )
})

// Listen to edge events
editor.on('edge:created', event => {
  console.log('Edge created:', event.data.edgeId)
})

editor.on('edge:selected', event => {
  console.log('Edge selected:', event.data.edgeId)
})

// Listen to viewport events
editor.on('viewport:changed', event => {
  console.log('Viewport changed:', event.data.viewport)
})

// Example 4: Programmatic manipulation
console.log('=== Example 4: Programmatic Manipulation ===')

// Get all nodes
const allNodes = editor.getAllNodes()
console.log('Total nodes:', allNodes.length)

// Get all edges
const allEdges = editor.getAllEdges()
console.log('Total edges:', allEdges.length)

// Find a specific node
const foundNode = editor.getNode('process-node')
if (foundNode) {
  console.log(
    'Found node:',
    foundNode.id,
    'at position:',
    foundNode.data.position
  )
}

// Update node data
if (foundNode) {
  foundNode.data.label = '数据处理 (已更新)'
  console.log('Updated node label')
}

// Example 5: Serialization
console.log('=== Example 5: Serialization ===')

// Export the current flow to JSON
const flowData = editor.toJSON()
console.log('Exported flow data:', {
  nodes: flowData.nodes.length,
  edges: flowData.edges.length,
  viewport: flowData.viewport,
})

// You can save this data to a file or database
const jsonString = JSON.stringify(flowData, null, 2)
console.log('Flow data as JSON string length:', jsonString.length)

// Example 6: Loading from JSON
console.log('=== Example 6: Loading from JSON ===')

// Create a new editor instance
const container2 = document.createElement('div')
const editor2 = new FlowEditor(container2)

// Load the previously exported data
try {
  editor2.fromJSON(flowData)
  console.log('Successfully loaded flow data into new editor')
  console.log('Loaded nodes:', editor2.getAllNodes().length)
  console.log('Loaded edges:', editor2.getAllEdges().length)
} catch (error) {
  console.error('Failed to load flow data:', error)
}

// Example 7: Cleanup
console.log('=== Example 7: Cleanup ===')

// Clean up event listeners and resources
editor.destroy()
editor2.destroy()

console.log('Basic usage examples completed!')

export { editor, startNode, processNode, endNode, connection1, connection2 }
