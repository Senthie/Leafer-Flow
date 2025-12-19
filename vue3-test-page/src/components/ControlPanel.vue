<template>
  <div class="control-panel">
    <div class="panel">
      <div class="panel-header">节点操作</div>
      <div class="panel-body">
        <div class="button-group">
          <button
            class="btn btn-primary"
            :disabled="!editor || isLoading"
            @click="createNode('start')"
          >
            <span class="btn-icon">🟢</span>
            添加开始节点
          </button>
          <button
            class="btn btn-primary"
            :disabled="!editor || isLoading"
            @click="createNode('process')"
          >
            <span class="btn-icon">⚙️</span>
            添加处理节点
          </button>
          <button
            class="btn btn-primary"
            :disabled="!editor || isLoading"
            @click="createNode('end')"
          >
            <span class="btn-icon">🔴</span>
            添加结束节点
          </button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">连接操作</div>
      <div class="panel-body">
        <div class="button-group">
          <button
            class="btn btn-secondary"
            :disabled="
              !editor ||
              isLoading ||
              !canCreateConnection ||
              props.isDragging ||
              props.isConnecting
            "
            @click="createConnection"
          >
            <span class="btn-icon">🔗</span>
            {{ props.isConnecting ? '连接中...' : '创建连接' }}
          </button>
          <p class="help-text">
            {{
              props.isConnecting
                ? '正在创建连接，请选择目标端口'
                : '需要至少两个兼容的节点才能创建连接'
            }}
          </p>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">画布操作</div>
      <div class="panel-body">
        <div class="button-group">
          <button
            class="btn btn-danger"
            :disabled="
              !editor || isLoading || props.isDragging || props.isConnecting
            "
            @click="clearCanvas"
          >
            <span class="btn-icon">🗑️</span>
            清空画布
          </button>
          <p class="help-text">
            {{
              props.isDragging
                ? '拖拽进行中，请等待完成'
                : props.isConnecting
                ? '连接进行中，请等待完成'
                : '清空所有节点和连接'
            }}
          </p>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">数据操作</div>
      <div class="panel-body">
        <div class="button-group">
          <button
            class="btn btn-info"
            :disabled="!editor || isLoading"
            @click="exportJSON"
          >
            <span class="btn-icon">📤</span>
            导出JSON
          </button>
          <button
            class="btn btn-info"
            :disabled="!editor || isLoading"
            @click="importJSON"
          >
            <span class="btn-icon">📥</span>
            导入预定义数据
          </button>
          <button
            class="btn btn-info"
            :disabled="!editor || isLoading"
            @click="showImportDialog"
          >
            <span class="btn-icon">📋</span>
            导入自定义JSON
          </button>
        </div>
        <p class="help-text">
          {{ serializationStatus }}
        </p>
      </div>
    </div>

    <!-- 自定义JSON导入对话框 -->
    <div v-if="showCustomImportDialog" class="import-dialog-overlay">
      <div class="import-dialog">
        <div class="import-dialog-header">
          <h3>导入自定义JSON数据</h3>
          <button class="close-btn" @click="closeImportDialog">×</button>
        </div>
        <div class="import-dialog-body">
          <textarea
            v-model="customJsonInput"
            class="json-input"
            placeholder="请粘贴JSON数据..."
            rows="10"
          ></textarea>
          <div v-if="jsonValidationError" class="validation-error">
            {{ jsonValidationError }}
          </div>
        </div>
        <div class="import-dialog-footer">
          <button class="btn btn-secondary" @click="closeImportDialog">
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="!customJsonInput || !!jsonValidationError"
            @click="importCustomJSON"
          >
            导入
          </button>
        </div>
      </div>
    </div>

    <!-- 操作反馈区域 -->
    <div v-if="feedback.message" class="feedback" :class="feedback.type">
      <div class="feedback-content">
        <span class="feedback-icon">
          {{
            feedback.type === 'success'
              ? '✅'
              : feedback.type === 'error'
              ? '❌'
              : 'ℹ️'
          }}
        </span>
        <span class="feedback-message">{{ feedback.message }}</span>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>{{ loadingMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { NodeData, EdgeData, FlowData } from '../../../src/types'

// Props interface
interface Props {
  editor: any | null
  disabled?: boolean
  isDragging?: boolean
  isConnecting?: boolean
  selectedNodeCount?: number
  selectedEdgeCount?: number
}

// Emits interface
interface Emits {
  (e: 'node-create', type: string, node: any): void
  (e: 'edge-create', edge: any): void
  (e: 'clear-canvas'): void
  (e: 'export-json', data: string): void
  (e: 'import-json', data?: FlowData): void
  (e: 'serialization-error', error: Error): void
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isDragging: false,
  isConnecting: false,
  selectedNodeCount: 0,
  selectedEdgeCount: 0,
})

// Emits
const emit = defineEmits<Emits>()

// Reactive state
const isLoading = ref(false)
const loadingMessage = ref('')
const feedback = ref<{
  type: 'success' | 'error' | 'info'
  message: string
}>({ type: 'info', message: '' })

// Node creation counter for unique positioning
const nodeCreationCount = ref(0)

// Serialization state
const showCustomImportDialog = ref(false)
const customJsonInput = ref('')
const jsonValidationError = ref('')
const lastExportedData = ref<string | null>(null)
const lastImportedData = ref<FlowData | null>(null)

// Computed properties
const canCreateConnection = computed(() => {
  if (!props.editor) return false

  const nodes = props.editor.getAllNodes()
  return nodes.length >= 2
})

// Serialization status message
const serializationStatus = computed(() => {
  if (lastExportedData.value) {
    try {
      const data = JSON.parse(lastExportedData.value)
      return `已导出: ${data.nodes?.length || 0} 个节点, ${
        data.edges?.length || 0
      } 条连接`
    } catch {
      return '导出数据可用'
    }
  }
  if (lastImportedData.value) {
    return `已导入: ${lastImportedData.value.nodes?.length || 0} 个节点, ${
      lastImportedData.value.edges?.length || 0
    } 条连接`
  }
  return '支持导出/导入工作流数据'
})

// Predefined node templates
const NODE_TEMPLATES = {
  start: {
    type: 'start',
    data: {
      label: '开始',
      description: '工作流开始节点',
    },
    ports: [
      {
        id: 'output',
        type: 'output' as const,
        position: 'right' as const,
        dataType: 'any',
      },
    ],
  },
  process: {
    type: 'process',
    data: {
      label: '处理',
      description: '数据处理节点',
    },
    ports: [
      {
        id: 'input',
        type: 'input' as const,
        position: 'left' as const,
        dataType: 'any',
      },
      {
        id: 'output',
        type: 'output' as const,
        position: 'right' as const,
        dataType: 'processed',
      },
    ],
  },
  end: {
    type: 'end',
    data: {
      label: '结束',
      description: '工作流结束节点',
    },
    ports: [
      {
        id: 'input',
        type: 'input' as const,
        position: 'left' as const,
        dataType: 'processed',
      },
    ],
  },
}

// Predefined test scenarios for import
const TEST_SCENARIOS: Record<string, FlowData> = {
  basic: {
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 150 },
        data: { label: '开始', description: '工作流开始节点' },
        ports: [
          {
            id: 'output',
            type: 'output' as const,
            position: 'right' as const,
            dataType: 'any',
          },
        ],
      },
      {
        id: 'process-1',
        type: 'process',
        position: { x: 300, y: 150 },
        data: { label: '处理', description: '数据处理节点' },
        ports: [
          {
            id: 'input',
            type: 'input' as const,
            position: 'left' as const,
            dataType: 'any',
          },
          {
            id: 'output',
            type: 'output' as const,
            position: 'right' as const,
            dataType: 'processed',
          },
        ],
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 500, y: 150 },
        data: { label: '结束', description: '工作流结束节点' },
        ports: [
          {
            id: 'input',
            type: 'input' as const,
            position: 'left' as const,
            dataType: 'processed',
          },
        ],
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start-1',
        sourcePort: 'output',
        target: 'process-1',
        targetPort: 'input',
      },
      {
        id: 'edge-2',
        source: 'process-1',
        sourcePort: 'output',
        target: 'end-1',
        targetPort: 'input',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  },
  complex: {
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 50, y: 100 },
        data: { label: '开始', description: '工作流入口' },
        ports: [
          {
            id: 'output',
            type: 'output' as const,
            position: 'right' as const,
            dataType: 'any',
          },
        ],
      },
      {
        id: 'process-1',
        type: 'process',
        position: { x: 250, y: 50 },
        data: { label: '处理A', description: '数据处理分支A' },
        ports: [
          {
            id: 'input',
            type: 'input' as const,
            position: 'left' as const,
            dataType: 'any',
          },
          {
            id: 'output',
            type: 'output' as const,
            position: 'right' as const,
            dataType: 'processed',
          },
        ],
      },
      {
        id: 'process-2',
        type: 'process',
        position: { x: 250, y: 150 },
        data: { label: '处理B', description: '数据处理分支B' },
        ports: [
          {
            id: 'input',
            type: 'input' as const,
            position: 'left' as const,
            dataType: 'any',
          },
          {
            id: 'output',
            type: 'output' as const,
            position: 'right' as const,
            dataType: 'processed',
          },
        ],
      },
      {
        id: 'process-3',
        type: 'process',
        position: { x: 450, y: 100 },
        data: { label: '合并', description: '数据合并节点' },
        ports: [
          {
            id: 'input',
            type: 'input' as const,
            position: 'left' as const,
            dataType: 'processed',
          },
          {
            id: 'output',
            type: 'output' as const,
            position: 'right' as const,
            dataType: 'processed',
          },
        ],
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 650, y: 100 },
        data: { label: '结束', description: '工作流出口' },
        ports: [
          {
            id: 'input',
            type: 'input' as const,
            position: 'left' as const,
            dataType: 'processed',
          },
        ],
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start-1',
        sourcePort: 'output',
        target: 'process-1',
        targetPort: 'input',
      },
      {
        id: 'edge-2',
        source: 'start-1',
        sourcePort: 'output',
        target: 'process-2',
        targetPort: 'input',
      },
      {
        id: 'edge-3',
        source: 'process-1',
        sourcePort: 'output',
        target: 'process-3',
        targetPort: 'input',
      },
      {
        id: 'edge-4',
        source: 'process-3',
        sourcePort: 'output',
        target: 'end-1',
        targetPort: 'input',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  },
}

// Default test scenario
const TEST_SCENARIO = TEST_SCENARIOS.basic

// Utility functions
const generateNodeId = (type: string): string => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const generateEdgeId = (): string => {
  return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const calculateNodePosition = (type: string): { x: number; y: number } => {
  const basePositions = {
    start: { x: 100, y: 150 },
    process: { x: 300, y: 150 },
    end: { x: 500, y: 150 },
  }

  const base = basePositions[type as keyof typeof basePositions] || {
    x: 200,
    y: 150,
  }
  const offset = nodeCreationCount.value * 50

  return {
    x: base.x + offset,
    y: base.y + offset,
  }
}

const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
  feedback.value = { type, message }

  // Auto-hide feedback after 3 seconds
  setTimeout(() => {
    if (feedback.value.message === message) {
      feedback.value = { type: 'info', message: '' }
    }
  }, 3000)
}

const setLoading = (loading: boolean, message = '') => {
  isLoading.value = loading
  loadingMessage.value = message
}

// Node creation
const createNode = async (type: string) => {
  if (!props.editor || props.disabled) return

  try {
    setLoading(
      true,
      `正在创建${
        NODE_TEMPLATES[type as keyof typeof NODE_TEMPLATES].data.label
      }节点...`
    )

    const template = NODE_TEMPLATES[type as keyof typeof NODE_TEMPLATES]
    const nodeData: NodeData = {
      id: generateNodeId(type),
      type: template.type,
      position: calculateNodePosition(type),
      data: { ...template.data },
      ports: template.ports,
    }

    const node = props.editor.addNode(nodeData)
    nodeCreationCount.value++

    emit('node-create', type, node)
    showFeedback('success', `${template.data.label}节点创建成功`)

    console.log(`${template.data.label}节点已创建:`, node)
  } catch (error) {
    console.error('节点创建失败:', error)
    showFeedback(
      'error',
      `节点创建失败: ${error instanceof Error ? error.message : '未知错误'}`
    )
  } finally {
    setLoading(false)
  }
}

// Connection creation
const createConnection = async () => {
  if (!props.editor || props.disabled) return

  try {
    setLoading(true, '正在创建连接...')

    const nodes = props.editor.getAllNodes()
    if (nodes.length < 2) {
      showFeedback('error', '需要至少两个节点才能创建连接')
      return
    }

    // Find compatible nodes for connection
    let sourceNode = null
    let targetNode = null
    let sourcePort = null
    let targetPort = null

    // Look for nodes that can be connected
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]

        // Try to find output port in node1 and input port in node2
        const outputPort = node1
          .getAllPorts()
          .find((p: any) => p.type === 'output')
        const inputPort = node2
          .getAllPorts()
          .find((p: any) => p.type === 'input')

        if (outputPort && inputPort) {
          const canConnect = props.editor.canConnect(
            node1.id,
            outputPort.id,
            node2.id,
            inputPort.id
          )

          if (canConnect.canConnect) {
            sourceNode = node1
            targetNode = node2
            sourcePort = outputPort
            targetPort = inputPort
            break
          }
        }

        // Try the reverse direction
        const outputPort2 = node2
          .getAllPorts()
          .find((p: any) => p.type === 'output')
        const inputPort1 = node1
          .getAllPorts()
          .find((p: any) => p.type === 'input')

        if (outputPort2 && inputPort1) {
          const canConnect = props.editor.canConnect(
            node2.id,
            outputPort2.id,
            node1.id,
            inputPort1.id
          )

          if (canConnect.canConnect) {
            sourceNode = node2
            targetNode = node1
            sourcePort = outputPort2
            targetPort = inputPort1
            break
          }
        }
      }

      if (sourceNode && targetNode) break
    }

    if (!sourceNode || !targetNode || !sourcePort || !targetPort) {
      showFeedback('error', '未找到可连接的节点对')
      return
    }

    const edgeData: EdgeData = {
      id: generateEdgeId(),
      source: sourceNode.id,
      sourcePort: sourcePort.id,
      target: targetNode.id,
      targetPort: targetPort.id,
    }

    const edge = props.editor.addEdge(edgeData)

    emit('edge-create', edge)
    showFeedback('success', '连接创建成功')

    console.log('连接已创建:', edge)
  } catch (error) {
    console.error('连接创建失败:', error)
    showFeedback(
      'error',
      `连接创建失败: ${error instanceof Error ? error.message : '未知错误'}`
    )
  } finally {
    setLoading(false)
  }
}

// Clear canvas
const clearCanvas = async () => {
  if (!props.editor || props.disabled) return

  try {
    setLoading(true, '正在清空画布...')

    // Get current counts for feedback
    const nodeCount = props.editor.getAllNodes().length
    const edgeCount = props.editor.getAllEdges().length

    // Clear all edges first
    const edges = props.editor.getAllEdges()
    for (const edge of edges) {
      props.editor.removeEdge(edge.id)
    }

    // Clear all nodes
    const nodes = props.editor.getAllNodes()
    for (const node of nodes) {
      props.editor.removeNode(node.id)
    }

    // Reset view
    props.editor.resetZoom()
    props.editor.centerView()

    // Reset creation counter
    nodeCreationCount.value = 0

    emit('clear-canvas')
    showFeedback(
      'success',
      `画布已清空 (删除了 ${nodeCount} 个节点和 ${edgeCount} 条连接)`
    )

    console.log('画布已清空')
  } catch (error) {
    console.error('清空画布失败:', error)
    showFeedback(
      'error',
      `清空画布失败: ${error instanceof Error ? error.message : '未知错误'}`
    )
  } finally {
    setLoading(false)
  }
}

// Validate JSON data structure
const validateFlowData = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '数据必须是一个对象' }
  }

  if (!Array.isArray(data.nodes)) {
    return { valid: false, error: '数据必须包含 nodes 数组' }
  }

  if (!Array.isArray(data.edges)) {
    return { valid: false, error: '数据必须包含 edges 数组' }
  }

  // Validate nodes
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i]
    if (!node.id || typeof node.id !== 'string') {
      return { valid: false, error: `节点 ${i} 缺少有效的 id` }
    }
    if (!node.type || typeof node.type !== 'string') {
      return { valid: false, error: `节点 ${node.id} 缺少有效的 type` }
    }
    if (
      !node.position ||
      typeof node.position.x !== 'number' ||
      typeof node.position.y !== 'number'
    ) {
      return { valid: false, error: `节点 ${node.id} 缺少有效的 position` }
    }
  }

  // Validate edges
  const nodeIds = new Set(data.nodes.map((n: any) => n.id))
  for (let i = 0; i < data.edges.length; i++) {
    const edge = data.edges[i]
    if (!edge.id || typeof edge.id !== 'string') {
      return { valid: false, error: `连接 ${i} 缺少有效的 id` }
    }
    if (!edge.source || !nodeIds.has(edge.source)) {
      return {
        valid: false,
        error: `连接 ${edge.id} 的源节点 ${edge.source} 不存在`,
      }
    }
    if (!edge.target || !nodeIds.has(edge.target)) {
      return {
        valid: false,
        error: `连接 ${edge.id} 的目标节点 ${edge.target} 不存在`,
      }
    }
  }

  // Validate viewport if present
  if (data.viewport) {
    if (typeof data.viewport.x !== 'number' || !isFinite(data.viewport.x)) {
      return { valid: false, error: 'viewport.x 必须是有效数字' }
    }
    if (typeof data.viewport.y !== 'number' || !isFinite(data.viewport.y)) {
      return { valid: false, error: 'viewport.y 必须是有效数字' }
    }
    if (typeof data.viewport.zoom !== 'number' || data.viewport.zoom <= 0) {
      return { valid: false, error: 'viewport.zoom 必须是正数' }
    }
  }

  return { valid: true }
}

// Export JSON
const exportJSON = async () => {
  if (!props.editor || props.disabled) return

  try {
    setLoading(true, '正在导出数据...')

    // Get current workflow state
    const jsonData = props.editor.toJSON()

    // Validate the exported data
    let parsedData: FlowData
    try {
      parsedData = JSON.parse(jsonData)
    } catch (parseError) {
      throw new Error('导出的数据格式无效')
    }

    const validation = validateFlowData(parsedData)
    if (!validation.valid) {
      throw new Error(`导出数据验证失败: ${validation.error}`)
    }

    // Store the exported data
    lastExportedData.value = jsonData
    lastImportedData.value = null

    emit('export-json', jsonData)

    // Also log to console for debugging
    console.log('导出的JSON数据:', parsedData)

    // Copy to clipboard if available
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(jsonData)
        showFeedback(
          'success',
          `JSON数据已导出并复制到剪贴板 (${parsedData.nodes.length} 个节点, ${parsedData.edges.length} 条连接)`
        )
      } catch (clipboardError) {
        showFeedback(
          'success',
          `JSON数据导出成功 (${parsedData.nodes.length} 个节点, ${parsedData.edges.length} 条连接)`
        )
      }
    } else {
      showFeedback(
        'success',
        `JSON数据导出成功 (${parsedData.nodes.length} 个节点, ${parsedData.edges.length} 条连接)`
      )
    }
  } catch (error) {
    console.error('导出JSON失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    showFeedback('error', `导出失败: ${errorMessage}`)
    emit(
      'serialization-error',
      error instanceof Error ? error : new Error(errorMessage)
    )
  } finally {
    setLoading(false)
  }
}

// Import predefined JSON
const importJSON = async () => {
  if (!props.editor || props.disabled) return

  try {
    setLoading(true, '正在导入预定义数据...')

    // Use predefined test scenario
    const scenarioData = TEST_SCENARIO

    // Validate the data before import
    const validation = validateFlowData(scenarioData)
    if (!validation.valid) {
      throw new Error(`预定义数据验证失败: ${validation.error}`)
    }

    const jsonData = JSON.stringify(scenarioData)

    // Import the data
    props.editor.fromJSON(jsonData)

    // Store the imported data
    lastImportedData.value = scenarioData
    lastExportedData.value = null

    emit('import-json', scenarioData)
    showFeedback(
      'success',
      `数据导入成功 (${scenarioData.nodes.length} 个节点, ${scenarioData.edges.length} 条连接)`
    )

    console.log('JSON数据已导入:', scenarioData)
  } catch (error) {
    console.error('导入JSON失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    showFeedback('error', `导入失败: ${errorMessage}`)
    emit(
      'serialization-error',
      error instanceof Error ? error : new Error(errorMessage)
    )
  } finally {
    setLoading(false)
  }
}

// Show custom import dialog
const showImportDialog = () => {
  showCustomImportDialog.value = true
  customJsonInput.value = ''
  jsonValidationError.value = ''
}

// Close custom import dialog
const closeImportDialog = () => {
  showCustomImportDialog.value = false
  customJsonInput.value = ''
  jsonValidationError.value = ''
}

// Validate custom JSON input in real-time
watch(customJsonInput, newValue => {
  if (!newValue.trim()) {
    jsonValidationError.value = ''
    return
  }

  try {
    const parsed = JSON.parse(newValue)
    const validation = validateFlowData(parsed)
    if (!validation.valid) {
      jsonValidationError.value = validation.error || '数据格式无效'
    } else {
      jsonValidationError.value = ''
    }
  } catch (e) {
    jsonValidationError.value = 'JSON格式无效'
  }
})

// Import custom JSON
const importCustomJSON = async () => {
  if (!props.editor || props.disabled || !customJsonInput.value) return

  try {
    setLoading(true, '正在导入自定义数据...')

    // Parse and validate the custom JSON
    let parsedData: FlowData
    try {
      parsedData = JSON.parse(customJsonInput.value)
    } catch (parseError) {
      throw new Error('JSON格式无效')
    }

    const validation = validateFlowData(parsedData)
    if (!validation.valid) {
      throw new Error(validation.error || '数据格式无效')
    }

    // Ensure viewport has default values if not provided
    if (!parsedData.viewport) {
      parsedData.viewport = { x: 0, y: 0, zoom: 1 }
    }

    // Ensure metadata has default values if not provided
    if (!parsedData.metadata) {
      parsedData.metadata = {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      }
    }

    // Import the data
    props.editor.fromJSON(JSON.stringify(parsedData))

    // Store the imported data
    lastImportedData.value = parsedData
    lastExportedData.value = null

    // Close dialog
    closeImportDialog()

    emit('import-json', parsedData)
    showFeedback(
      'success',
      `自定义数据导入成功 (${parsedData.nodes.length} 个节点, ${parsedData.edges.length} 条连接)`
    )

    console.log('自定义JSON数据已导入:', parsedData)
  } catch (error) {
    console.error('导入自定义JSON失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    jsonValidationError.value = errorMessage
    showFeedback('error', `导入失败: ${errorMessage}`)
    emit(
      'serialization-error',
      error instanceof Error ? error : new Error(errorMessage)
    )
  } finally {
    setLoading(false)
  }
}

// Watch for editor changes to update connection availability
watch(
  () => props.editor,
  newEditor => {
    if (newEditor) {
      // Listen for node events to update connection availability
      newEditor.on('node:created', () => {
        // Force reactivity update
        nodeCreationCount.value = nodeCreationCount.value
      })

      newEditor.on('node:deleted', () => {
        // Force reactivity update
        nodeCreationCount.value = nodeCreationCount.value
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.panel-header {
  padding: 12px 16px;
  background-color: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color-light);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color-primary);
}

.panel-body {
  padding: 16px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--bg-color-disabled);
  color: var(--text-color-disabled);
}

.btn-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color-hover);
  border-color: var(--primary-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
  border-color: var(--secondary-color);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--secondary-color-hover);
  border-color: var(--secondary-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
  border-color: var(--danger-color);
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--danger-color-hover);
  border-color: var(--danger-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.btn-info {
  background-color: var(--info-color);
  color: white;
  border-color: var(--info-color);
}

.btn-info:hover:not(:disabled) {
  background-color: var(--info-color-hover);
  border-color: var(--info-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.help-text {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.feedback {
  padding: 12px 16px;
  border-radius: var(--border-radius);
  border: 1px solid;
  margin-top: 8px;
}

.feedback.success {
  background-color: var(--success-bg);
  border-color: var(--success-color);
  color: var(--success-color);
}

.feedback.error {
  background-color: var(--danger-bg);
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.feedback.info {
  background-color: var(--info-bg);
  border-color: var(--info-color);
  color: var(--info-color);
}

.feedback-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feedback-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.feedback-message {
  font-size: 14px;
  line-height: 1.4;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--bg-color-overlay);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
  margin-top: 8px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color-light);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-indicator span {
  font-size: 14px;
  color: var(--text-color-secondary);
}

/* 导入对话框样式 */
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.import-dialog {
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.import-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.import-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: 0;
  line-height: 1;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--danger-color);
}

.import-dialog-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.json-input {
  width: 100%;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  resize: vertical;
  line-height: 1.5;
  min-height: 200px;
}

.json-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.validation-error {
  margin-top: 12px;
  padding: 10px 12px;
  background-color: var(--danger-bg);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  color: var(--danger-color);
  font-size: 13px;
}

.import-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-panel {
    gap: 12px;
  }

  .panel-body {
    padding: 12px;
  }

  .btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .btn-icon {
    font-size: 14px;
  }

  .feedback {
    padding: 10px 12px;
  }

  .feedback-message {
    font-size: 13px;
  }

  .loading-indicator {
    padding: 10px 12px;
  }

  .loading-indicator span {
    font-size: 13px;
  }

  .import-dialog {
    width: 95%;
    max-height: 90vh;
  }

  .import-dialog-header {
    padding: 12px 16px;
  }

  .import-dialog-body {
    padding: 16px;
  }

  .import-dialog-footer {
    padding: 12px 16px;
  }

  .json-input {
    font-size: 12px;
    min-height: 150px;
  }
}
</style>
