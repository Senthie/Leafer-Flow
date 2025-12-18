/**
 * Leafer-Flow Examples Index
 *
 * This file provides easy access to all available examples.
 * Import and run the examples you're interested in.
 */

// Basic usage examples
export * from './basic-usage'

// Common scenario examples
export * from './common-scenarios'

// Advanced features (already exists)
// Note: advanced-features-demo.ts is already available

/**
 * Example Categories:
 *
 * 1. Basic Usage (basic-usage.ts)
 *    - Creating a flow editor
 *    - Adding nodes and edges
 *    - Basic event handling
 *    - Serialization/deserialization
 *
 * 2. Common Scenarios (common-scenarios.ts)
 *    - Data processing pipeline
 *    - Decision tree workflow
 *    - State machine
 *    - Form workflow
 *
 * 3. Advanced Features (advanced-features-demo.ts)
 *    - Custom node types
 *    - Custom edge styles
 *    - Undo/redo functionality
 *    - Performance optimization
 *    - Batch operations
 */

/**
 * Quick Start Guide:
 *
 * 1. Install dependencies using pnpm:
 *    pnpm install
 *
 * 2. Run the examples:
 *    pnpm run dev
 *
 * 3. Import the examples you want to try:
 *    import { editor } from './examples/basic-usage'
 *    import { createDataProcessingPipeline } from './examples/common-scenarios'
 *
 * 4. Create your own examples based on these templates
 */

// Utility function to run all examples
export async function runAllExamples() {
  console.log('=== Running All Leafer-Flow Examples ===')

  try {
    // Import and run basic usage
    console.log('\n1. Running Basic Usage Examples...')
    await import('./basic-usage')

    // Import and run common scenarios
    console.log('\n2. Running Common Scenarios...')
    await import('./common-scenarios')

    // Import and run advanced features
    console.log('\n3. Running Advanced Features Demo...')
    await import('./advanced-features-demo')

    console.log('\n✅ All examples completed successfully!')
  } catch (error) {
    console.error('❌ Error running examples:', error)
  }
}

// Export example metadata for documentation
export const exampleMetadata = {
  'basic-usage': {
    title: '基础使用示例',
    description: '演示 Leafer-Flow 的基本功能，包括节点创建、连接、事件处理等',
    difficulty: 'beginner',
    topics: ['节点创建', '连接管理', '事件处理', '序列化'],
  },
  'common-scenarios': {
    title: '常见场景示例',
    description: '展示实际应用中的常见工作流场景',
    difficulty: 'intermediate',
    topics: ['数据处理管道', '决策树', '状态机', '表单流程'],
  },
  'advanced-features-demo': {
    title: '高级功能演示',
    description: '展示 Leafer-Flow 的高级特性和性能优化功能',
    difficulty: 'advanced',
    topics: ['自定义渲染', '性能优化', '撤销重做', '批量操作'],
  },
}

// Helper function to get example by name
export function getExample(name: keyof typeof exampleMetadata) {
  return exampleMetadata[name]
}

// Helper function to list all available examples
export function listExamples() {
  console.log('Available Leafer-Flow Examples:')
  console.log('================================')

  Object.entries(exampleMetadata).forEach(([name, info]) => {
    console.log(`\n📁 ${name}`)
    console.log(`   标题: ${info.title}`)
    console.log(`   描述: ${info.description}`)
    console.log(`   难度: ${info.difficulty}`)
    console.log(`   主题: ${info.topics.join(', ')}`)
  })

  console.log('\n使用方法:')
  console.log('import { runAllExamples } from "./examples"')
  console.log('runAllExamples()')
}

// Auto-run examples if this file is executed directly
if (
  typeof window !== 'undefined' &&
  window.location?.pathname?.includes('examples')
) {
  console.log('Leafer-Flow Examples loaded!')
  listExamples()
}
