import { useCallback, useMemo, useState } from 'react'
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'

import {
  Activity,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Database,
  GitBranch,
  Layers3,
  Network,
  Plus,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Workflow,
  X,
} from 'lucide-react'

import './App.css'

type NodeData = Record<string, unknown> & {
  title: string
  category: string
  description: string
  icon: 'server' | 'database' | 'shield'
  status: 'normal' | 'warning'
  childrenCount?: number
}

type SystemNode = Node<NodeData, 'system'>

const initialNodes: SystemNode[] = [
  {
    id: 'gateway',
    type: 'system',
    position: { x: 300, y: 25 },
    data: {
      title: 'API Gateway',
      category: 'ENTRY POINT',
      description: 'Routes incoming requests to internal services.',
      icon: 'server',
      status: 'normal',
    },
  },
  {
    id: 'auth',
    type: 'system',
    position: { x: 50, y: 205 },
    data: {
      title: 'Authentication',
      category: 'SERVICE',
      description: 'Manages identity and access validation.',
      icon: 'shield',
      status: 'normal',
      childrenCount: 5,
    },
  },
  {
    id: 'payments',
    type: 'system',
    position: { x: 300, y: 205 },
    data: {
      title: 'Payment Service',
      category: 'SERVICE',
      description: 'Processes transactions and payment requests.',
      icon: 'server',
      status: 'warning',
      childrenCount: 8,
    },
    selected: true,
  },
  {
    id: 'notifications',
    type: 'system',
    position: { x: 550, y: 205 },
    data: {
      title: 'Notifications',
      category: 'SERVICE',
      description: 'Delivers transaction and account notifications.',
      icon: 'server',
      status: 'normal',
    },
  },
  {
    id: 'database',
    type: 'system',
    position: { x: 190, y: 420 },
    data: {
      title: 'Transaction DB',
      category: 'DATABASE',
      description: 'Stores transaction and payment records.',
      icon: 'database',
      status: 'normal',
    },
  },
  {
    id: 'queue',
    type: 'system',
    position: { x: 440, y: 420 },
    data: {
      title: 'Message Queue',
      category: 'INFRASTRUCTURE',
      description: 'Coordinates background transaction processing.',
      icon: 'server',
      status: 'normal',
      childrenCount: 3,
    },
  },
  {
    id: 'monitor',
    type: 'system',
    position: { x: 750, y: 420 },
    data: {
      title: 'Observability',
      category: 'MONITORING',
      description: 'Collects operational metrics and application logs.',
      icon: 'database',
      status: 'normal',
    },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'gateway',
    sourceHandle: 'bottom-source',
    target: 'auth',
    targetHandle: 'top-target',
    label: 'validates',
    type: 'smoothstep',
  },
  {
    id: 'e2',
    source: 'gateway',
    sourceHandle: 'bottom-source',
    target: 'payments',
    targetHandle: 'top-target',
    label: 'routes to',
    type: 'smoothstep',
  },
  {
    id: 'e3',
    source: 'gateway',
    sourceHandle: 'bottom-source',
    target: 'notifications',
    targetHandle: 'top-target',
    label: 'routes to',
    type: 'smoothstep',
  },
  {
    id: 'e4',
    source: 'auth',
    sourceHandle: 'right-source',
    target: 'payments',
    targetHandle: 'left-target',
    label: 'authorizes',
    type: 'smoothstep',
  },
  {
    id: 'e5',
    source: 'payments',
    sourceHandle: 'bottom-source',
    target: 'database',
    targetHandle: 'top-target',
    label: 'writes to',
    type: 'smoothstep',
  },
  {
    id: 'e6',
    source: 'payments',
    sourceHandle: 'bottom-source',
    target: 'queue',
    targetHandle: 'top-target',
    label: 'publishes to',
    type: 'smoothstep',
  },
  {
    id: 'e7',
    source: 'queue',
    sourceHandle: 'top-source',
    target: 'notifications',
    targetHandle: 'bottom-target',
    label: 'triggers',
    type: 'smoothstep',
  },
].map((edge) => ({
  ...edge,
  style: { stroke: '#536D8C', strokeWidth: 1.6 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#718AA8',
  },
}))

function SystemNodeView({ data, selected }: NodeProps<SystemNode>) {
  const Icon =
    data.icon === 'database'
      ? Database
      : data.icon === 'shield'
        ? ShieldCheck
        : Server

  return (
    <div className={`system-node ${selected ? 'is-selected' : ''}`}>

      {/* TOP CONNECTIONS */}
      <Handle id="top-target" type="target" position={Position.Top}
        style={{ left: '42%' }} />

      <Handle id="top-source" type="source" position={Position.Top}
        style={{ left: '58%' }} />

      {/* SIDE CONNECTIONS */}
      <Handle id="left-target" type="target" position={Position.Left} />

      <Handle id="right-source" type="source" position={Position.Right} />

      {/* NODE CONTENT */}
      <div className="node-heading">
        <div className={`node-icon ${data.icon}`}>
          <Icon size={15} />
        </div>

        <span className="node-category">{data.category}</span>

        <span className={`node-status ${data.status}`} />
      </div>

      <div className="node-title">{data.title}</div>

      <div className="node-description">{data.description}</div>

      {data.childrenCount ? (
        <div className="node-meta">
          <Layers3 size={12} />
          {data.childrenCount} contained components
        </div>
      ) : null}

      {/* BOTTOM CONNECTIONS */}
      <Handle id="bottom-source" type="source" position={Position.Bottom}
        style={{ left: '42%' }} />

      <Handle id="bottom-target" type="target" position={Position.Bottom}
        style={{ left: '58%' }} />

    </div>
  )
}

const nodeTypes = {
  system: SystemNodeView,
} satisfies NodeTypes

function getConnectedNodes(startId: string, edges: Edge[]) {
  const connected = new Set([startId])

  let changed = true

  while (changed) {
    changed = false

    for (const edge of edges) {
      if (connected.has(edge.source) && !connected.has(edge.target)) {
        connected.add(edge.target)
        changed = true
      }

      if (connected.has(edge.target) && !connected.has(edge.source)) {
        connected.add(edge.source)
        changed = true
      }
    }
  }

  return connected
}

export default function App() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<SystemNode>(initialNodes)

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges)

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>('payments')

  const [selectedEdgeId, setSelectedEdgeId] =
    useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [showExplorer, setShowExplorer] = useState(true)

  const selectedNode =
    nodes.find((node) => node.id === selectedNodeId) ?? null

  const selectedEdge =
    edges.find((edge) => edge.id === selectedEdgeId) ?? null

  const connectedNodeIds = useMemo(
    () =>
      selectedNodeId
        ? getConnectedNodes(selectedNodeId, edges)
        : new Set<string>(),
    [selectedNodeId, edges],
  )

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => {
        const matchesSearch =
          !search ||
          node.data.title.toLowerCase().includes(search.toLowerCase()) ||
          node.data.category.toLowerCase().includes(search.toLowerCase())

        const belongsToSelection =
          !selectedNodeId || connectedNodeIds.has(node.id)

        return {
          ...node,
          style: {
            ...node.style,
            opacity: matchesSearch && belongsToSelection ? 1 : 0.18,
          },
        }
      }),
    [nodes, search, selectedNodeId, connectedNodeIds],
  )

  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const isSelected = edge.id === selectedEdgeId
  
        const isConnectedToSelection =
          selectedNodeId &&
          connectedNodeIds.has(edge.source) &&
          connectedNodeIds.has(edge.target)
  
        const highlighted = selectedEdgeId
          ? isSelected
          : selectedNodeId
            ? isConnectedToSelection
            : false
  
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isSelected
              ? '#FFD08A'
              : highlighted
                ? '#7CCBF3'
                : '#536D8C',
            strokeWidth: isSelected ? 3 : highlighted ? 2 : 1.4,
            opacity: selectedEdgeId
              ? isSelected ? 1 : 0.15
              : selectedNodeId
                ? highlighted ? 1 : 0.12
                : 0.8,
          },
        }
      }),
    [edges, selectedNodeId, selectedEdgeId, connectedNodeIds],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#718AA8',
            },
            style: {
              stroke: '#718AA8',
              strokeWidth: 1.6,
            },
          },
          currentEdges,
        ),
      )
    },
    [setEdges],
  )

  const addNode = () => {
    const id = `node-${Date.now()}`

    const newNode: SystemNode = {
      id,
      type: 'system',
      position: {
        x: 100 + (nodes.length % 3) * 240,
        y: 500 + Math.floor(nodes.length / 3) * 110,
      },
      data: {
        title: 'New Component',
        category: 'COMPONENT',
        description: 'Newly created information node.',
        icon: 'server',
        status: 'normal',
      },
    }

    setNodes((current) => [...current, newNode])
    setSelectedNodeId(id)
  }

  const selectNode = (id: string) => {
    setSelectedNodeId(id)
    setSelectedEdgeId(null)
  
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        selected: node.id === id,
      })),
    )
  
    setEdges((current) =>
      current.map((edge) => ({
        ...edge,
        selected: false,
      })),
    )
  }

  const selectEdge = (id: string) => {
    setSelectedEdgeId(id)
    setSelectedNodeId(null)
  
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        selected: false,
      })),
    )
  
    setEdges((current) =>
      current.map((edge) => ({
        ...edge,
        selected: edge.id === id,
      })),
    )
  }
  
  const connectedEdges = selectedNode
    ? edges.filter(
        (edge) =>
          edge.source === selectedNode.id ||
          edge.target === selectedNode.id,
      )
    : []

  const updateSelectedEdgeLabel = (label: string) => {
    setEdges((current) =>
      current.map((edge) =>
        edge.id === selectedEdgeId
          ? { ...edge, label }
          : edge,
      ),
    )
  }
  
  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return
  
    setEdges((current) =>
      current.filter((edge) => edge.id !== selectedEdgeId),
    )
  
    setSelectedEdgeId(null)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Network size={20} />
          </div>

          <div>
            <div className="brand-name">Graph Playground</div>
            <div className="brand-subtitle">SYSTEM EXPLORER</div>
          </div>
        </div>

        <div className="topbar-middle">
          <span>Workspace</span>
          <ChevronRight size={14} />
          <strong>Infrastructure map</strong>
        </div>

        <div className="topbar-actions">
          <span className="local-status">
            <span />
            Local workspace
          </span>

          <button className="primary-button" onClick={addNode}>
            <Plus size={15} />
            Add node
          </button>
        </div>
      </header>

      {showExplorer && (
        <aside className="explorer panel">
          <div className="panel-heading">
            <span>EXPLORER</span>
            <button
              className="icon-button"
              onClick={() => setShowExplorer(false)}
              title="Hide explorer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="search-box">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search nodes..."
            />
          </div>

          <div className="explorer-section">
            <div className="section-title">
              <ChevronDown size={14} />
              INFRASTRUCTURE
            </div>

            <div className="tree-list">
              {nodes.map((node) => (
                <button
                  key={node.id}
                  className={`tree-item ${selectedNodeId === node.id ? 'active' : ''}`}
                  onClick={() => selectNode(node.id)}
                >
                  <CircleDot size={13} />
                  <span>{node.data.title}</span>
                  {node.data.status === 'warning' && (
                    <span className="tree-warning" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="explorer-footer">
            <div><Layers3 size={14} /> {nodes.length} nodes</div>
            <div><GitBranch size={14} /> {edges.length} links</div>
          </div>
        </aside>
      )}

      <section className="canvas-area">
        {!showExplorer && (
          <button
            className="restore-panel"
            onClick={() => setShowExplorer(true)}
            title="Show explorer"
          >
            <Workflow size={17} />
          </button>
        )}

        <div className="canvas-toolbar">
          <div className="canvas-label">
            <Workflow size={15} />
            <span>GRAPH CANVAS</span>
          </div>

          <div className="canvas-actions">
            <span>{nodes.length} nodes</span>
            <span>{edges.length} links</span>
            <button
              className="icon-button"
              title="Reset sample graph"
              onClick={() => {
                setNodes(initialNodes)
                setEdges(initialEdges)
                setSelectedNodeId('payments')
              }}
            >
              <Activity size={15} />
            </button>
          </div>
        </div>

        <div className="flow-wrapper">
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={(_, edge) => selectEdge(edge.id)}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => {
              setSelectedNodeId(null)
              setSelectedEdgeId(null)
            
              setNodes((current) =>
                current.map((node) => ({ ...node, selected: false })),
              )
            
              setEdges((current) =>
                current.map((edge) => ({ ...edge, selected: false })),
              )
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.8}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            connectionLineStyle={{ stroke: '#7CCBF3', strokeWidth: 2 }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1}
              color="#29394D"
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div className="canvas-hint">
          Drag nodes to reposition · Drag between handles to connect · Select to explore
        </div>
      </section>
      
      <aside className="inspector panel">
      
        <div className="panel-heading">
          <span>INSPECTOR</span>
          <Settings2 size={15} />
        </div>
      
        {selectedEdge ? (
        <div className="inspector-content">
          <div className="inspector-section-title">
            SELECTED RELATIONSHIP
          </div>
      
          <h2>Connection</h2>
      
          <div className="inspector-divider" />
      
          <div className="stat-row">
            <span>Source</span>
            <strong>
              {nodes.find((n) => n.id === selectedEdge.source)?.data.title
                ?? selectedEdge.source}
            </strong>
          </div>
      
          <div className="stat-row">
            <span>Target</span>
            <strong>
              {nodes.find((n) => n.id === selectedEdge.target)?.data.title
                ?? selectedEdge.target}
            </strong>
          </div>
      
          <div className="inspector-divider" />
      
          <div className="inspector-section-title">
            RELATIONSHIP LABEL
          </div>
      
          <input
            className="inspector-input"
            value={typeof selectedEdge.label === 'string' ? selectedEdge.label : ''}
            onChange={(event) => updateSelectedEdgeLabel(event.target.value)}
            placeholder="Describe this relationship..."
          />
      
          <div className="inspector-divider" />
      
          <div className="stat-row">
            <span>Direction</span>
            <strong>Directed</strong>
          </div>
      
          <div className="stat-row">
            <span>Link ID</span>
            <strong>{selectedEdge.id}</strong>
          </div>
      
          <button className="danger-button" onClick={deleteSelectedEdge}>
            Delete connection
          </button>
        </div>

      ) : selectedNode ? (
          <div className="inspector-content">
            <div className="inspector-type">
              <span className={`node-icon ${selectedNode.data.icon}`}>
                {selectedNode.data.icon === 'database' ? (
                  <Database size={17} />
                ) : selectedNode.data.icon === 'shield' ? (
                  <ShieldCheck size={17} />
                ) : (
                  <Server size={17} />
                )}
              </span>

              <span>{selectedNode.data.category}</span>
            </div>

            <h2>{selectedNode.data.title}</h2>

            <p className="inspector-description">
              {selectedNode.data.description}
            </p>

            <div className="inspector-id">
              ID: {selectedNode.id}
            </div>

            <div className="inspector-divider" />

            <div className="inspector-section-title">OVERVIEW</div>

            <div className="stat-row">
              <span>Direct connections</span>
              <strong>{connectedEdges.length}</strong>
            </div>

            <div className="stat-row">
              <span>Contained nodes</span>
              <strong>{selectedNode.data.childrenCount ?? 0}</strong>
            </div>

            <div className="inspector-divider" />

            <div className="inspector-section-title">CONNECTED NODES</div>

            <div className="connected-list">
              {connectedEdges.map((edge) => {
                const otherId =
                  edge.source === selectedNode.id
                    ? edge.target
                    : edge.source

                const otherNode = nodes.find((node) => node.id === otherId)

                if (!otherNode) return null

                return (
                  <button
                    key={edge.id}
                    className="connected-item"
                    onClick={() => selectNode(otherId)}
                  >
                    <span>{otherNode.data.title}</span>
                    <ChevronRight size={14} />
                  </button>
                )
              })}

              {connectedEdges.length === 0 && (
                <p className="empty-message">No connections yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-inspector">
            <Network size={25} />
            <strong>No node selected</strong>
            <span>Select a node to inspect its information and connections.</span>
          </div>
        )}

        <div className="inspector-bottom">
          <span>GRAPH ENGINE</span>
          <span className="engine-indicator">INITIALIZING</span>
        </div>
      </aside>

      <footer className="statusbar">
        <span><span className="status-dot" /> All changes local</span>
        <span>Graph Playground · Prototype v0.1</span>
      </footer>
    </main>
  )
}