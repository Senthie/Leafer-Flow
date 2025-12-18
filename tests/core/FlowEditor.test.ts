// Basic tests for FlowEditor class

import { FlowEditor } from "../../src/core/FlowEditor"

describe("FlowEditor", () => {
  let container: HTMLElement
  let editor: FlowEditor

  beforeEach(() => {
    container = document.createElement("div")
    container.style.width = "800px"
    container.style.height = "600px"
    document.body.appendChild(container)

    editor = new FlowEditor(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe("initialization", () => {
    it("should create FlowEditor instance with container", () => {
      expect(editor).toBeInstanceOf(FlowEditor)
    })

    it("should initialize with default options", () => {
      const editorWithDefaults = new FlowEditor(container)
      expect(editorWithDefaults).toBeInstanceOf(FlowEditor)
    })

    it("should accept custom options", () => {
      const customEditor = new FlowEditor(container, {
        background: "#f0f0f0",
        grid: false,
        minimap: true,
      })
      expect(customEditor).toBeInstanceOf(FlowEditor)
    })
  })

  describe("node operations", () => {
    it("should have node management methods", () => {
      expect(typeof editor.addNode).toBe("function")
      expect(typeof editor.removeNode).toBe("function")
      expect(typeof editor.getNode).toBe("function")
      expect(typeof editor.getAllNodes).toBe("function")
    })

    it("should return empty array for getAllNodes initially", () => {
      expect(editor.getAllNodes()).toEqual([])
    })

    it("should return null for non-existent node", () => {
      expect(editor.getNode("non-existent")).toBeNull()
    })
  })

  describe("edge operations", () => {
    it("should have edge management methods", () => {
      expect(typeof editor.addEdge).toBe("function")
      expect(typeof editor.removeEdge).toBe("function")
      expect(typeof editor.getEdge).toBe("function")
      expect(typeof editor.getAllEdges).toBe("function")
    })

    it("should return empty array for getAllEdges initially", () => {
      expect(editor.getAllEdges()).toEqual([])
    })

    it("should return null for non-existent edge", () => {
      expect(editor.getEdge("non-existent")).toBeNull()
    })
  })

  describe("view control", () => {
    it("should have view control methods", () => {
      expect(typeof editor.zoomTo).toBe("function")
      expect(typeof editor.panTo).toBe("function")
      expect(typeof editor.fitView).toBe("function")
    })
  })

  describe("event system", () => {
    it("should have event management methods", () => {
      expect(typeof editor.on).toBe("function")
      expect(typeof editor.off).toBe("function")
    })
  })

  describe("serialization", () => {
    it("should have serialization methods", () => {
      expect(typeof editor.toJSON).toBe("function")
      expect(typeof editor.fromJSON).toBe("function")
    })
  })
})
