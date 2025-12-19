import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ControlPanel from './ControlPanel.vue'

// Mock FlowEditor
const mockEditor = {
  getAllNodes: vi.fn(() => []),
  getAllEdges: vi.fn(() => []),
  addNode: vi.fn(),
  addEdge: vi.fn(),
  removeNode: vi.fn(),
  removeEdge: vi.fn(),
  canConnect: vi.fn(() => ({ canConnect: true })),
  toJSON: vi.fn(() => '{"nodes":[],"edges":[]}'),
  fromJSON: vi.fn(),
  resetZoom: vi.fn(),
  centerView: vi.fn(),
  on: vi.fn(),
}

describe('ControlPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all control sections', () => {
    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    // Check if all panel sections are rendered
    expect(wrapper.text()).toContain('节点操作')
    expect(wrapper.text()).toContain('连接操作')
    expect(wrapper.text()).toContain('画布操作')
    expect(wrapper.text()).toContain('数据操作')
  })

  it('should render all node creation buttons', () => {
    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    expect(wrapper.text()).toContain('添加开始节点')
    expect(wrapper.text()).toContain('添加处理节点')
    expect(wrapper.text()).toContain('添加结束节点')
  })

  it('should render connection and canvas control buttons', () => {
    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    expect(wrapper.text()).toContain('创建连接')
    expect(wrapper.text()).toContain('清空画布')
  })

  it('should render data operation buttons', () => {
    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    expect(wrapper.text()).toContain('导出JSON')
    expect(wrapper.text()).toContain('导入JSON')
  })

  it('should disable buttons when no editor is provided', () => {
    const wrapper = mount(ControlPanel, {
      props: {
        editor: null,
      },
    })

    const buttons = wrapper.findAll('button')
    buttons.forEach(button => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  it('should enable most buttons when editor is provided', () => {
    // Mock having 2 nodes so connection button is enabled
    mockEditor.getAllNodes.mockReturnValue([
      { id: 'node1', getAllPorts: () => [{ id: 'output', type: 'output' }] },
      { id: 'node2', getAllPorts: () => [{ id: 'input', type: 'input' }] },
    ])

    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    // Check node creation buttons (should be enabled)
    const nodeButtons = wrapper.findAll('button').slice(0, 3) // First 3 buttons are node creation
    nodeButtons.forEach(button => {
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })

  it('should emit node-create event when node button is clicked', async () => {
    mockEditor.addNode.mockReturnValue({ id: 'test-node', type: 'start' })

    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    const startNodeButton = wrapper.find('button:first-child')
    await startNodeButton.trigger('click')

    expect(mockEditor.addNode).toHaveBeenCalled()
    expect(wrapper.emitted('node-create')).toBeTruthy()
  })

  it('should show help text for connection creation', () => {
    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    expect(wrapper.text()).toContain('需要至少两个兼容的节点才能创建连接')
  })

  it('should disable connection button when less than 2 nodes exist', () => {
    mockEditor.getAllNodes.mockReturnValue([]) // No nodes

    const wrapper = mount(ControlPanel, {
      props: {
        editor: mockEditor,
      },
    })

    const connectionButton = wrapper.find('button[disabled]')
    expect(connectionButton.exists()).toBe(true)
  })
})
