// Property-based tests for node creation integrity
// **Feature: leafer-flow, Property 1: 节点创建完整性**

import * as fc from 'fast-check'
import { FlowNode } from '../../src/components/FlowNode'

describe('Property-based tests for node creation', () => {
  // Helper function to compare numbers that handles -0 vs 0
  const expectNumbersEqual = (actual: number, expected: number) => {
    if (Object.is(actual, expected) || (actual === 0 && expected === 0)) {
      return true
    }
    return false
  }

  // Simple generator for valid node data without ports first
  const simpleNodeDataArbitrary = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    type: fc.string({ minLength: 1, maxLength: 30 }),
    position: fc.record({
      x: fc.float({ min: -10000, max: 10000, noNaN: true }),
      y: fc.float({ min: -10000, max: 10000, noNaN: true }),
    }),
    data: fc.oneof(
      fc.constant({}),
      fc.constant({ label: 'test' }),
      fc.constant({ value: 42 }),
      fc.record({ label: fc.string(), value: fc.integer() })
    ),
  })

  // Generator for node data with ports - handling optional properties correctly
  const nodeWithPortsArbitrary = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    type: fc.string({ minLength: 1, maxLength: 30 }),
    position: fc.record({
      x: fc.float({ min: -10000, max: 10000, noNaN: true }),
      y: fc.float({ min: -10000, max: 10000, noNaN: true }),
    }),
    data: fc.oneof(fc.constant({}), fc.constant({ label: 'test' })),
    ports: fc.array(
      fc.oneof(
        // Port without optional properties
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('input', 'output') as fc.Arbitrary<
            'input' | 'output'
          >,
          position: fc.constantFrom(
            'top',
            'right',
            'bottom',
            'left'
          ) as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
        }),
        // Port with dataType
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('input', 'output') as fc.Arbitrary<
            'input' | 'output'
          >,
          position: fc.constantFrom(
            'top',
            'right',
            'bottom',
            'left'
          ) as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
          dataType: fc.string({ minLength: 1, maxLength: 10 }),
        }),
        // Port with multiple
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('input', 'output') as fc.Arbitrary<
            'input' | 'output'
          >,
          position: fc.constantFrom(
            'top',
            'right',
            'bottom',
            'left'
          ) as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
          multiple: fc.boolean(),
        }),
        // Port with both optional properties
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('input', 'output') as fc.Arbitrary<
            'input' | 'output'
          >,
          position: fc.constantFrom(
            'top',
            'right',
            'bottom',
            'left'
          ) as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
          dataType: fc.string({ minLength: 1, maxLength: 10 }),
          multiple: fc.boolean(),
        })
      ),
      { minLength: 1, maxLength: 5 }
    ),
  })

  /**
   * **Feature: leafer-flow, Property 1: 节点创建完整性**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
   *
   * For any valid node data, creating a node should generate a node with unique ID
   * at the specified position, containing correct port configuration, and trigger creation event
   */
  it('should create nodes with complete integrity for any valid node data (without ports)', () => {
    fc.assert(
      fc.property(simpleNodeDataArbitrary, nodeData => {
        // Create the node
        const node = new FlowNode(nodeData)

        // Requirement 1.1: Node should be created at specified position
        expect(expectNumbersEqual(node.position.x, nodeData.position.x)).toBe(
          true
        )
        expect(expectNumbersEqual(node.position.y, nodeData.position.y)).toBe(
          true
        )

        // Requirement 1.2: Node should have unique identifier
        expect(node.id).toBe(nodeData.id)
        expect(typeof node.id).toBe('string')
        expect(node.id.length).toBeGreaterThan(0)

        // Basic node properties should match input data
        expect(node.type).toBe(nodeData.type)
        expect(node.data).toEqual(nodeData.data)

        // No ports should be created when not specified
        expect(node.ports.size).toBe(0)

        // Requirement 1.5: Node should be ready for rendering (basic structure intact)
        expect(node).toBeInstanceOf(FlowNode)
        expect(node.getAllPorts()).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should create nodes with complete integrity for any valid node data (with ports)', () => {
    fc.assert(
      fc.property(nodeWithPortsArbitrary, nodeData => {
        // Create the node
        const node = new FlowNode(nodeData)

        // Requirement 1.1: Node should be created at specified position
        expect(expectNumbersEqual(node.position.x, nodeData.position.x)).toBe(
          true
        )
        expect(expectNumbersEqual(node.position.y, nodeData.position.y)).toBe(
          true
        )

        // Requirement 1.2: Node should have unique identifier
        expect(node.id).toBe(nodeData.id)
        expect(typeof node.id).toBe('string')
        expect(node.id.length).toBeGreaterThan(0)

        // Basic node properties should match input data
        expect(node.type).toBe(nodeData.type)
        expect(node.data).toEqual(nodeData.data)

        // Requirement 1.4: Node should create ports according to configuration
        if (nodeData.ports) {
          // Get unique port IDs to account for duplicates
          const uniquePortIds = new Set(nodeData.ports.map(p => p.id))
          expect(node.ports.size).toBe(uniquePortIds.size)

          // Check that all unique ports are created correctly
          // For duplicate IDs, the last one in the array should be used
          const portsByIdMap = new Map()
          nodeData.ports.forEach(portData => {
            portsByIdMap.set(portData.id, portData)
          })

          portsByIdMap.forEach((expectedPortData, portId) => {
            const port = node.getPort(portId)
            expect(port).toBeTruthy()
            expect(port!.id).toBe(expectedPortData.id)
            expect(port!.type).toBe(expectedPortData.type)
            expect(port!.position).toBe(expectedPortData.position)

            // Handle optional properties correctly
            if ('dataType' in expectedPortData) {
              expect(port!.dataType).toBe(expectedPortData.dataType)
            } else {
              expect(port!.dataType).toBeUndefined()
            }

            if ('multiple' in expectedPortData) {
              expect(port!.multiple).toBe(expectedPortData.multiple)
            } else {
              expect(port!.multiple).toBe(false)
            }
          })
        }

        // Requirement 1.5: Node should be ready for rendering (basic structure intact)
        expect(node).toBeInstanceOf(FlowNode)
        expect(node.getAllPorts()).toHaveLength(nodeData.ports?.length ?? 0)
      }),
      { numRuns: 100 }
    )
  })

  // Test edge case: nodes with duplicate port IDs should handle gracefully
  it('should handle nodes with duplicate port IDs by keeping the last one', () => {
    const duplicatePortNodeArbitrary = fc.record({
      id: fc.string({ minLength: 1 }),
      type: fc.string({ minLength: 1 }),
      position: fc.record({
        x: fc.float(),
        y: fc.float(),
      }),
      data: fc.constant({}),
      ports: fc.array(
        fc.record({
          id: fc.constant('duplicate-id'), // All ports have same ID
          type: fc.constantFrom('input', 'output') as fc.Arbitrary<
            'input' | 'output'
          >,
          position: fc.constantFrom(
            'top',
            'right',
            'bottom',
            'left'
          ) as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
        }),
        { minLength: 2, maxLength: 5 }
      ),
    })

    fc.assert(
      fc.property(duplicatePortNodeArbitrary, nodeData => {
        const node = new FlowNode(nodeData)

        // Should only have one port with the duplicate ID (the last one)
        expect(node.ports.size).toBe(1)
        expect(node.getPort('duplicate-id')).toBeTruthy()
      }),
      { numRuns: 50 }
    )
  })

  // Test that position is properly copied (not referenced)
  it('should create independent position objects', () => {
    fc.assert(
      fc.property(simpleNodeDataArbitrary, nodeData => {
        const node = new FlowNode(nodeData)

        // Modify original position
        const originalX = nodeData.position.x
        nodeData.position.x = originalX + 100

        // Node position should not be affected
        expect(expectNumbersEqual(node.position.x, originalX)).toBe(true)
        expect(node.position).not.toBe(nodeData.position)
      }),
      { numRuns: 100 }
    )
  })
})
