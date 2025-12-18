/**
 * Common Usage Scenarios
 *
 * This example demonstrates common real-world scenarios when using Leafer-Flow:
 * - Building a data processing pipeline
 * - Creating a decision tree workflow
 * - Implementing a state machine
 * - Building a form workflow
 */

import { FlowEditor } from '../src/core/FlowEditor'
import { NodeData, EdgeData } from '../src/types'

// Scenario 1: Data Processing Pipeline
console.log('=== Scenario 1: Data Processing Pipeline ===')

function createDataProcessingPipeline(): FlowEditor {
  const container = document.createElement('div')
  const editor = new FlowEditor(container, {
    background: '#f0f2f5',
    grid: true,
  })

  // Input node
  const inputNode: NodeData = {
    id: 'data-input',
    type: 'default',
    position: { x: 50, y: 200 },
    data: {
      label: '数据输入',
      nodeType: 'input',
      config: { source: 'database', table: 'users' },
    },
    ports: [
      { id: 'output', type: 'output', position: 'right', dataType: 'raw-data' },
    ],
  }

  // Validation node
  const validationNode: NodeData = {
    id: 'data-validation',
    type: 'default',
    position: { x: 250, y: 200 },
    data: {
      label: '数据验证',
      nodeType: 'validation',
      config: { rules: ['required', 'email', 'length'] },
    },
    ports: [
      { id: 'input', type: 'input', position: 'left', dataType: 'raw-data' },
      {
        id: 'valid',
        type: 'output',
        position: 'right',
        dataType: 'valid-data',
      },
      {
        id: 'invalid',
        type: 'output',
        position: 'bottom',
        dataType: 'error-data',
      },
    ],
  }

  // Transform node
  const transformNode: NodeData = {
    id: 'data-transform',
    type: 'default',
    position: { x: 450, y: 200 },
    data: {
      label: '数据转换',
      nodeType: 'transform',
      config: { operations: ['normalize', 'encrypt', 'format'] },
    },
    ports: [
      { id: 'input', type: 'input', position: 'left', dataType: 'valid-data' },
      {
        id: 'output',
        type: 'output',
        position: 'right',
        dataType: 'transformed-data',
      },
    ],
  }

  // Output node
  const outputNode: NodeData = {
    id: 'data-output',
    type: 'default',
    position: { x: 650, y: 200 },
    data: {
      label: '数据输出',
      nodeType: 'output',
      config: { destination: 'api', endpoint: '/processed-data' },
    },
    ports: [
      {
        id: 'input',
        type: 'input',
        position: 'left',
        dataType: 'transformed-data',
      },
    ],
  }

  // Error handling node
  const errorNode: NodeData = {
    id: 'error-handler',
    type: 'default',
    position: { x: 250, y: 350 },
    data: {
      label: '错误处理',
      nodeType: 'error',
      config: { action: 'log-and-notify' },
    },
    ports: [
      { id: 'input', type: 'input', position: 'top', dataType: 'error-data' },
    ],
  }

  // Add nodes
  editor.addNode(inputNode)
  editor.addNode(validationNode)
  editor.addNode(transformNode)
  editor.addNode(outputNode)
  editor.addNode(errorNode)

  // Create connections
  editor.addEdge({
    id: 'input-to-validation',
    source: 'data-input',
    sourcePort: 'output',
    target: 'data-validation',
    targetPort: 'input',
  })

  editor.addEdge({
    id: 'validation-to-transform',
    source: 'data-validation',
    sourcePort: 'valid',
    target: 'data-transform',
    targetPort: 'input',
  })

  editor.addEdge({
    id: 'transform-to-output',
    source: 'data-transform',
    sourcePort: 'output',
    target: 'data-output',
    targetPort: 'input',
  })

  editor.addEdge({
    id: 'validation-to-error',
    source: 'data-validation',
    sourcePort: 'invalid',
    target: 'error-handler',
    targetPort: 'input',
  })

  console.log(
    'Created data processing pipeline with',
    editor.getAllNodes().length,
    'nodes'
  )
  return editor
}

// Scenario 2: Decision Tree Workflow
console.log('=== Scenario 2: Decision Tree Workflow ===')

function createDecisionTreeWorkflow(): FlowEditor {
  const container = document.createElement('div')
  const editor = new FlowEditor(container)

  // Start node
  const startNode: NodeData = {
    id: 'start',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: '开始', nodeType: 'start' },
    ports: [{ id: 'output', type: 'output', position: 'bottom' }],
  }

  // Decision nodes
  const ageDecision: NodeData = {
    id: 'age-decision',
    type: 'default',
    position: { x: 100, y: 200 },
    data: {
      label: '年龄检查',
      nodeType: 'decision',
      condition: 'age >= 18',
    },
    ports: [
      { id: 'input', type: 'input', position: 'top' },
      { id: 'yes', type: 'output', position: 'right' },
      { id: 'no', type: 'output', position: 'left' },
    ],
  }

  const incomeDecision: NodeData = {
    id: 'income-decision',
    type: 'default',
    position: { x: 300, y: 200 },
    data: {
      label: '收入检查',
      nodeType: 'decision',
      condition: 'income >= 50000',
    },
    ports: [
      { id: 'input', type: 'input', position: 'left' },
      { id: 'yes', type: 'output', position: 'bottom' },
      { id: 'no', type: 'output', position: 'right' },
    ],
  }

  // Result nodes
  const approvedNode: NodeData = {
    id: 'approved',
    type: 'default',
    position: { x: 300, y: 350 },
    data: {
      label: '批准',
      nodeType: 'result',
      result: 'approved',
    },
    ports: [{ id: 'input', type: 'input', position: 'top' }],
  }

  const rejectedNode: NodeData = {
    id: 'rejected',
    type: 'default',
    position: { x: 500, y: 200 },
    data: {
      label: '拒绝',
      nodeType: 'result',
      result: 'rejected',
    },
    ports: [{ id: 'input', type: 'input', position: 'left', multiple: true }],
  }

  const underageNode: NodeData = {
    id: 'underage',
    type: 'default',
    position: { x: 50, y: 300 },
    data: {
      label: '未成年',
      nodeType: 'result',
      result: 'underage',
    },
    ports: [{ id: 'input', type: 'input', position: 'right' }],
  }[
    // Add all nodes
    (startNode,
    ageDecision,
    incomeDecision,
    approvedNode,
    rejectedNode,
    underageNode)
  ].forEach(node => editor.addNode(node))

  // Create decision flow connections
  const connections: EdgeData[] = [
    {
      id: 'start-to-age',
      source: 'start',
      sourcePort: 'output',
      target: 'age-decision',
      targetPort: 'input',
    },
    {
      id: 'age-yes-to-income',
      source: 'age-decision',
      sourcePort: 'yes',
      target: 'income-decision',
      targetPort: 'input',
    },
    {
      id: 'age-no-to-underage',
      source: 'age-decision',
      sourcePort: 'no',
      target: 'underage',
      targetPort: 'input',
    },
    {
      id: 'income-yes-to-approved',
      source: 'income-decision',
      sourcePort: 'yes',
      target: 'approved',
      targetPort: 'input',
    },
    {
      id: 'income-no-to-rejected',
      source: 'income-decision',
      sourcePort: 'no',
      target: 'rejected',
      targetPort: 'input',
    },
  ]

  connections.forEach(conn => editor.addEdge(conn))

  console.log(
    'Created decision tree workflow with',
    editor.getAllNodes().length,
    'nodes'
  )
  return editor
}

// Scenario 3: State Machine
console.log('=== Scenario 3: State Machine ===')

function createStateMachine(): FlowEditor {
  const container = document.createElement('div')
  const editor = new FlowEditor(container)

  // State nodes
  const states = [
    {
      id: 'idle',
      position: { x: 100, y: 200 },
      label: '空闲',
      transitions: ['start'],
    },
    {
      id: 'running',
      position: { x: 300, y: 200 },
      label: '运行中',
      transitions: ['pause', 'stop', 'complete'],
    },
    {
      id: 'paused',
      position: { x: 300, y: 100 },
      label: '暂停',
      transitions: ['resume', 'stop'],
    },
    {
      id: 'completed',
      position: { x: 500, y: 200 },
      label: '已完成',
      transitions: ['reset'],
    },
    {
      id: 'stopped',
      position: { x: 300, y: 300 },
      label: '已停止',
      transitions: ['reset'],
    },
  ]

  // Create state nodes
  states.forEach(state => {
    const nodeData: NodeData = {
      id: state.id,
      type: 'default',
      position: state.position,
      data: {
        label: state.label,
        nodeType: 'state',
        isInitial: state.id === 'idle',
      },
      ports: [
        { id: 'input', type: 'input', position: 'left', multiple: true },
        { id: 'output', type: 'output', position: 'right', multiple: true },
      ],
    }
    editor.addNode(nodeData)
  })

  // Create transitions
  const transitions = [
    { from: 'idle', to: 'running', trigger: 'start' },
    { from: 'running', to: 'paused', trigger: 'pause' },
    { from: 'running', to: 'completed', trigger: 'complete' },
    { from: 'running', to: 'stopped', trigger: 'stop' },
    { from: 'paused', to: 'running', trigger: 'resume' },
    { from: 'paused', to: 'stopped', trigger: 'stop' },
    { from: 'completed', to: 'idle', trigger: 'reset' },
    { from: 'stopped', to: 'idle', trigger: 'reset' },
  ]

  transitions.forEach((transition, index) => {
    editor.addEdge({
      id: `transition-${index}`,
      source: transition.from,
      sourcePort: 'output',
      target: transition.to,
      targetPort: 'input',
      data: { trigger: transition.trigger },
    })
  })

  console.log(
    'Created state machine with',
    states.length,
    'states and',
    transitions.length,
    'transitions'
  )
  return editor
}

// Scenario 4: Form Workflow
console.log('=== Scenario 4: Form Workflow ===')

function createFormWorkflow(): FlowEditor {
  const container = document.createElement('div')
  const editor = new FlowEditor(container)

  // Form steps
  const formSteps = [
    {
      id: 'personal-info',
      position: { x: 100, y: 150 },
      label: '个人信息',
      fields: ['name', 'email', 'phone'],
    },
    {
      id: 'address-info',
      position: { x: 300, y: 150 },
      label: '地址信息',
      fields: ['street', 'city', 'zipcode'],
    },
    {
      id: 'payment-info',
      position: { x: 500, y: 150 },
      label: '支付信息',
      fields: ['cardNumber', 'expiryDate', 'cvv'],
    },
    {
      id: 'review',
      position: { x: 700, y: 150 },
      label: '信息确认',
      fields: [],
    },
    {
      id: 'submit',
      position: { x: 900, y: 150 },
      label: '提交',
      fields: [],
    },
  ]

  // Validation nodes
  const validationNodes = [
    {
      id: 'validate-personal',
      position: { x: 200, y: 50 },
      label: '验证个人信息',
      validates: 'personal-info',
    },
    {
      id: 'validate-address',
      position: { x: 400, y: 50 },
      label: '验证地址信息',
      validates: 'address-info',
    },
    {
      id: 'validate-payment',
      position: { x: 600, y: 50 },
      label: '验证支付信息',
      validates: 'payment-info',
    },
  ]

  // Create form step nodes
  formSteps.forEach(step => {
    const nodeData: NodeData = {
      id: step.id,
      type: 'default',
      position: step.position,
      data: {
        label: step.label,
        nodeType: 'form-step',
        fields: step.fields,
      },
      ports: [
        { id: 'input', type: 'input', position: 'left' },
        { id: 'output', type: 'output', position: 'right' },
        { id: 'validate', type: 'output', position: 'top' },
      ],
    }
    editor.addNode(nodeData)
  })

  // Create validation nodes
  validationNodes.forEach(validator => {
    const nodeData: NodeData = {
      id: validator.id,
      type: 'default',
      position: validator.position,
      data: {
        label: validator.label,
        nodeType: 'validator',
      },
      ports: [
        { id: 'input', type: 'input', position: 'bottom' },
        { id: 'valid', type: 'output', position: 'right' },
        { id: 'invalid', type: 'output', position: 'left' },
      ],
    }
    editor.addNode(nodeData)
  })

  // Create flow connections
  for (let i = 0; i < formSteps.length - 1; i++) {
    editor.addEdge({
      id: `step-${i}-to-${i + 1}`,
      source: formSteps[i].id,
      sourcePort: 'output',
      target: formSteps[i + 1].id,
      targetPort: 'input',
    })
  }

  // Create validation connections
  const validationConnections = [
    { step: 'personal-info', validator: 'validate-personal' },
    { step: 'address-info', validator: 'validate-address' },
    { step: 'payment-info', validator: 'validate-payment' },
  ]

  validationConnections.forEach((conn, index) => {
    editor.addEdge({
      id: `validation-${index}`,
      source: conn.step,
      sourcePort: 'validate',
      target: conn.validator,
      targetPort: 'input',
    })
  })

  console.log(
    'Created form workflow with',
    formSteps.length,
    'steps and',
    validationNodes.length,
    'validators'
  )
  return editor
}

// Example usage and cleanup
const pipeline = createDataProcessingPipeline()
const decisionTree = createDecisionTreeWorkflow()
const stateMachine = createStateMachine()
const formWorkflow = createFormWorkflow()

console.log('=== All Common Scenarios Created ===')
console.log('Data Processing Pipeline: ✓')
console.log('Decision Tree Workflow: ✓')
console.log('State Machine: ✓')
console.log('Form Workflow: ✓')

// Export for use in other examples
export {
  createDataProcessingPipeline,
  createDecisionTreeWorkflow,
  createStateMachine,
  createFormWorkflow,
}

// Cleanup
setTimeout(() => {
  pipeline.destroy()
  decisionTree.destroy()
  stateMachine.destroy()
  formWorkflow.destroy()
  console.log('Cleaned up all scenario examples')
}, 1000)
