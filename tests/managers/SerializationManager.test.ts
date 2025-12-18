// Unit tests for SerializationManager

import { SerializationManager } from '../../src/managers/SerializationManager'
import { FlowData, ViewportState } from '../../src/types'
import { FlowError, FlowErrorType } from '../../src/errors/FlowError'

// Mock FlowNode for testing
class MockFlowNode {
  constructor(
    public id: string,
    public type: string,
    public position: { x: number; y: number },
    public data: any,
    public ports: Map<string, MockFlowPort> = new Map()
  ) {}
}

// Mock FlowEdge for testing
class MockFlowEdge {
  constructor(
    public id: string,
    public source: { id: string },
    public sourcePort: { id: string },
    public target: { id: string },
    public targetPort: { id: string },
    public data?: any
  ) {}
}

// Mock FlowPort for testing
class MockFlowPort {
  constructor(
    public id: string,
    public type: 'input' | 'output',
    public dataType?: string,
    public multiple?: boolean,
    public position: 'top' | 'right' | 'bottom' | 'left' = 'right'
  ) {}
}

describe('SerializationManager', () => {
  describe('serialize', () => {
    it('should serialize basic workflow data', () => {
      const nodes = [
        new MockFlowNode(
          'node1',
          'basic',
          { x: 100, y: 200 },
          { label: 'Node 1' }
        ),
      ] as any[]

      const edges = [
        new MockFlowEdge(
          'edge1',
          { id: 'node1' },
          { id: 'port1' },
          { id: 'node2' },
          { id: 'port2' }
        ),
      ] as any[]

      const viewport: ViewportState = { x: 0, y: 0, zoom: 1.0 }

      const result = SerializationManager.serialize(nodes, edges, viewport)
      const parsed = JSON.parse(result)

      expect(parsed.nodes).toHaveLength(1)
      expect(parsed.edges).toHaveLength(1)
      expect(parsed.viewport).toEqual(viewport)
      expect(parsed.metadata).toBeDefined()
      expect(parsed.metadata.version).toBe('1.0.0')
    })

    it('should serialize nodes with ports', () => {
      const ports = new Map([
        ['port1', new MockFlowPort('port1', 'input', 'string', false, 'left')],
        ['port2', new MockFlowPort('port2', 'output', 'number', true, 'right')],
      ])

      const nodes = [
        new MockFlowNode(
          'node1',
          'custom',
          { x: 50, y: 75 },
          { value: 42 },
          ports
        ),
      ] as any[]

      const result = SerializationManager.serialize(nodes, [], {
        x: 0,
        y: 0,
        zoom: 1.0,
      })
      const parsed = JSON.parse(result)

      expect(parsed.nodes[0].ports).toHaveLength(2)
      expect(parsed.nodes[0].ports[0]).toEqual({
        id: 'port1',
        type: 'input',
        dataType: 'string',
        multiple: false,
        position: 'left',
      })
      expect(parsed.nodes[0].ports[1]).toEqual({
        id: 'port2',
        type: 'output',
        dataType: 'number',
        multiple: true,
        position: 'right',
      })
    })

    it('should serialize with custom options', () => {
      const nodes = [] as any[]
      const edges = [] as any[]
      const viewport: ViewportState = { x: 10, y: 20, zoom: 1.5 }

      const result = SerializationManager.serialize(nodes, edges, viewport, {
        includeMetadata: false,
        prettyPrint: true,
      })

      const parsed = JSON.parse(result)
      expect(parsed.metadata).toBeUndefined()
      expect(result.includes('\n')).toBe(true) // Pretty printed
    })

    it('should handle serialization errors', () => {
      // Create a node with circular reference to cause serialization error
      const circularNode = new MockFlowNode(
        'node1',
        'basic',
        { x: 0, y: 0 },
        {}
      )
      circularNode.data = { self: circularNode }

      expect(() => {
        SerializationManager.serialize([circularNode] as any[], [], {
          x: 0,
          y: 0,
          zoom: 1.0,
        })
      }).toThrow(FlowError)
    })
  })

  describe('deserialize', () => {
    it('should deserialize valid workflow data', () => {
      const validData: FlowData = {
        nodes: [
          {
            id: 'node1',
            type: 'basic',
            position: { x: 100, y: 200 },
            data: { label: 'Test Node' },
          },
        ],
        edges: [
          {
            id: 'edge1',
            source: 'node1',
            sourcePort: 'port1',
            target: 'node2',
            targetPort: 'port2',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1.0 },
        metadata: {
          version: '1.0.0',
          created: '2023-01-01T00:00:00.000Z',
          modified: '2023-01-01T00:00:00.000Z',
        },
      }

      const jsonString = JSON.stringify(validData)
      const result = SerializationManager.deserialize(jsonString)

      expect(result).toEqual(validData)
    })

    it('should deserialize data with ports', () => {
      const dataWithPorts: FlowData = {
        nodes: [
          {
            id: 'node1',
            type: 'custom',
            position: { x: 0, y: 0 },
            data: {},
            ports: [
              {
                id: 'input1',
                type: 'input',
                dataType: 'string',
                multiple: false,
                position: 'left',
              },
              {
                id: 'output1',
                type: 'output',
                position: 'right',
              },
            ],
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1.0 },
      }

      const jsonString = JSON.stringify(dataWithPorts)
      const result = SerializationManager.deserialize(jsonString)

      expect(result.nodes[0].ports).toHaveLength(2)
      expect(result.nodes[0].ports![0].type).toBe('input')
      expect(result.nodes[0].ports![1].type).toBe('output')
    })

    it('should throw error for invalid JSON', () => {
      expect(() => {
        SerializationManager.deserialize('invalid json')
      }).toThrow(FlowError)
    })

    it('should throw error for missing required fields', () => {
      const invalidData = {
        nodes: [{ id: 'node1' }], // Missing required fields
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1.0 },
      }

      expect(() => {
        SerializationManager.deserialize(JSON.stringify(invalidData))
      }).toThrow(FlowError)
    })

    it('should throw error for invalid node data', () => {
      const invalidNodeData = {
        nodes: [
          {
            id: '', // Empty ID
            type: 'basic',
            position: { x: 100, y: 200 },
            data: {},
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1.0 },
      }

      expect(() => {
        SerializationManager.deserialize(JSON.stringify(invalidNodeData))
      }).toThrow(FlowError)
    })

    it('should throw error for invalid edge data', () => {
      const invalidEdgeData = {
        nodes: [],
        edges: [
          {
            id: 'edge1',
            source: '', // Empty source
            sourcePort: 'port1',
            target: 'node2',
            targetPort: 'port2',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1.0 },
      }

      expect(() => {
        SerializationManager.deserialize(JSON.stringify(invalidEdgeData))
      }).toThrow(FlowError)
    })

    it('should throw error for invalid viewport data', () => {
      const invalidViewportData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: -1 }, // Invalid zoom
      }

      expect(() => {
        SerializationManager.deserialize(JSON.stringify(invalidViewportData))
      }).toThrow(FlowError)
    })

    it('should throw error for invalid port data', () => {
      const invalidPortData = {
        nodes: [
          {
            id: 'node1',
            type: 'custom',
            position: { x: 0, y: 0 },
            data: {},
            ports: [
              {
                id: 'port1',
                type: 'invalid', // Invalid port type
                position: 'left',
              },
            ],
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1.0 },
      }

      expect(() => {
        SerializationManager.deserialize(JSON.stringify(invalidPortData))
      }).toThrow(FlowError)
    })

    it('should throw error for unsupported version', () => {
      const unsupportedVersionData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1.0 },
        metadata: {
          version: '2.0.0', // Unsupported version
          created: '2023-01-01T00:00:00.000Z',
          modified: '2023-01-01T00:00:00.000Z',
        },
      }

      expect(() => {
        SerializationManager.deserialize(JSON.stringify(unsupportedVersionData))
      }).toThrow(FlowError)
    })
  })

  describe('utility methods', () => {
    it('should validate JSON strings', () => {
      expect(SerializationManager.isValidJSON('{"valid": true}')).toBe(true)
      expect(SerializationManager.isValidJSON('invalid json')).toBe(false)
      expect(SerializationManager.isValidJSON('')).toBe(false)
    })

    it('should return current version', () => {
      expect(SerializationManager.getVersion()).toBe('1.0.0')
    })

    it('should return supported versions', () => {
      const versions = SerializationManager.getSupportedVersions()
      expect(versions).toContain('1.0.0')
      expect(Array.isArray(versions)).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should throw FlowError with correct type for serialization errors', () => {
      const circularNode = new MockFlowNode(
        'node1',
        'basic',
        { x: 0, y: 0 },
        {}
      )
      circularNode.data = { self: circularNode }

      try {
        SerializationManager.serialize([circularNode] as any[], [], {
          x: 0,
          y: 0,
          zoom: 1.0,
        })
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FlowError)
        expect((error as FlowError).type).toBe(
          FlowErrorType.SERIALIZATION_ERROR
        )
      }
    })

    it('should throw FlowError with correct type for deserialization errors', () => {
      try {
        SerializationManager.deserialize('invalid json')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FlowError)
        expect((error as FlowError).type).toBe(
          FlowErrorType.DESERIALIZATION_ERROR
        )
      }
    })

    it('should include error details in FlowError', () => {
      try {
        SerializationManager.deserialize('invalid json')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FlowError)
        expect((error as FlowError).details).toBeDefined()
        expect((error as FlowError).details.originalError).toBeDefined()
      }
    })
  })
})
