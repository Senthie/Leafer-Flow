// Tests for validation functions

import {
  validateNodeData,
  validateEdgeData,
  validatePortData,
  validateFlowData,
  validateConnection,
  FlowError,
} from '../../src'

describe('Validation Functions', () => {
  describe('validateNodeData', () => {
    it('should validate valid node data', () => {
      const validNode = {
        id: 'node1',
        type: 'basic',
        position: { x: 100, y: 200 },
        data: { label: 'Test Node' },
      }

      expect(() => validateNodeData(validNode)).not.toThrow()
      expect(validateNodeData(validNode)).toBe(true)
    })

    it('should validate node with ports', () => {
      const nodeWithPorts = {
        id: 'node1',
        type: 'basic',
        position: { x: 100, y: 200 },
        data: { label: 'Test Node' },
        ports: [
          {
            id: 'port1',
            type: 'input' as const,
            position: 'left' as const,
          },
        ],
      }

      expect(() => validateNodeData(nodeWithPorts)).not.toThrow()
    })

    it('should throw error for invalid node data', () => {
      expect(() => validateNodeData(null)).toThrow(FlowError)
      expect(() => validateNodeData({})).toThrow(FlowError)
      expect(() => validateNodeData({ id: 'test' })).toThrow(FlowError)
    })

    it('should throw error for invalid position', () => {
      const invalidNode = {
        id: 'node1',
        type: 'basic',
        position: { x: 'invalid', y: 200 },
        data: {},
      }

      expect(() => validateNodeData(invalidNode)).toThrow(FlowError)
    })
  })

  describe('validatePortData', () => {
    it('should validate valid port data', () => {
      const validPort = {
        id: 'port1',
        type: 'input' as const,
        position: 'left' as const,
      }

      expect(() => validatePortData(validPort)).not.toThrow()
      expect(validatePortData(validPort)).toBe(true)
    })

    it('should validate port with optional fields', () => {
      const portWithOptions = {
        id: 'port1',
        type: 'output' as const,
        position: 'right' as const,
        dataType: 'string',
        multiple: true,
      }

      expect(() => validatePortData(portWithOptions)).not.toThrow()
    })

    it('should throw error for invalid port type', () => {
      const invalidPort = {
        id: 'port1',
        type: 'invalid',
        position: 'left',
      }

      expect(() => validatePortData(invalidPort)).toThrow(FlowError)
    })

    it('should throw error for invalid position', () => {
      const invalidPort = {
        id: 'port1',
        type: 'input',
        position: 'invalid',
      }

      expect(() => validatePortData(invalidPort)).toThrow(FlowError)
    })
  })

  describe('validateEdgeData', () => {
    it('should validate valid edge data', () => {
      const validEdge = {
        id: 'edge1',
        source: 'node1',
        sourcePort: 'port1',
        target: 'node2',
        targetPort: 'port2',
      }

      expect(() => validateEdgeData(validEdge)).not.toThrow()
      expect(validateEdgeData(validEdge)).toBe(true)
    })

    it('should validate edge with optional data', () => {
      const edgeWithData = {
        id: 'edge1',
        source: 'node1',
        sourcePort: 'port1',
        target: 'node2',
        targetPort: 'port2',
        data: { label: 'Connection' },
      }

      expect(() => validateEdgeData(edgeWithData)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      expect(() => validateEdgeData({})).toThrow(FlowError)
      expect(() => validateEdgeData({ id: 'edge1' })).toThrow(FlowError)
    })
  })

  describe('validateFlowData', () => {
    it('should validate valid flow data', () => {
      const validFlow = {
        nodes: [
          {
            id: 'node1',
            type: 'basic',
            position: { x: 100, y: 200 },
            data: {},
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
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      }

      expect(() => validateFlowData(validFlow)).not.toThrow()
      expect(validateFlowData(validFlow)).toBe(true)
    })

    it('should validate flow data with metadata', () => {
      const flowWithMetadata = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        metadata: {
          version: '1.0.0',
          created: '2023-01-01',
          modified: '2023-01-02',
        },
      }

      expect(() => validateFlowData(flowWithMetadata)).not.toThrow()
    })

    it('should throw error for invalid flow structure', () => {
      expect(() => validateFlowData(null)).toThrow(FlowError)
      expect(() => validateFlowData({})).toThrow(FlowError)
      expect(() => validateFlowData({ nodes: 'invalid' })).toThrow(FlowError)
    })
  })

  describe('validateConnection', () => {
    it('should validate valid connection', () => {
      const sourcePort = {
        id: 'port1',
        type: 'output' as const,
        position: 'right' as const,
      }

      const targetPort = {
        id: 'port2',
        type: 'input' as const,
        position: 'left' as const,
      }

      expect(() => validateConnection(sourcePort, targetPort)).not.toThrow()
      expect(validateConnection(sourcePort, targetPort)).toBe(true)
    })

    it('should validate connection with matching data types', () => {
      const sourcePort = {
        id: 'port1',
        type: 'output' as const,
        position: 'right' as const,
        dataType: 'string',
      }

      const targetPort = {
        id: 'port2',
        type: 'input' as const,
        position: 'left' as const,
        dataType: 'string',
      }

      expect(() => validateConnection(sourcePort, targetPort)).not.toThrow()
    })

    it('should throw error for invalid connection direction', () => {
      const sourcePort = {
        id: 'port1',
        type: 'input' as const,
        position: 'left' as const,
      }

      const targetPort = {
        id: 'port2',
        type: 'output' as const,
        position: 'right' as const,
      }

      expect(() => validateConnection(sourcePort, targetPort)).toThrow(
        FlowError
      )
    })

    it('should throw error for data type mismatch', () => {
      const sourcePort = {
        id: 'port1',
        type: 'output' as const,
        position: 'right' as const,
        dataType: 'string',
      }

      const targetPort = {
        id: 'port2',
        type: 'input' as const,
        position: 'left' as const,
        dataType: 'number',
      }

      expect(() => validateConnection(sourcePort, targetPort)).toThrow(
        FlowError
      )
    })
  })
})
