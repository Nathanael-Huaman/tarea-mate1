import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position
} from 'reactflow';
import dagre from 'dagre';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import useTaskStore from '../stores/taskStore';

import 'reactflow/dist/style.css';

const nodeWidth = 120;
const nodeHeight = 50;

// Función para posicionar nodos usando Dagre
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

// Componente de nodo personalizado
const CustomNode = ({ data }) => {
  const isMinimal = data.isMinimal;
  const isMaximal = data.isMaximal;
  
  let nodeClass = 'px-4 py-2 rounded-lg border-2 bg-white text-center font-semibold shadow-md';
  
  if (isMinimal && isMaximal) {
    nodeClass += ' border-purple-500 bg-purple-50 text-purple-800';
  } else if (isMinimal) {
    nodeClass += ' border-green-500 bg-green-50 text-green-800';
  } else if (isMaximal) {
    nodeClass += ' border-red-500 bg-red-50 text-red-800';
  } else {
    nodeClass += ' border-blue-500 bg-blue-50 text-blue-800';
  }
  
  return (
    <div className={nodeClass}>
      <div className="text-sm font-bold">{data.label}</div>
      {(isMinimal || isMaximal) && (
        <div className="text-xs mt-1">
          {isMinimal && isMaximal ? 'Min & Max' : isMinimal ? 'Mínima' : 'Máxima'}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const HasseDiagram = () => {
  const { tasks, dependencies, results } = useTaskStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutDirection, setLayoutDirection] = React.useState('TB');

  const layoutOptions = [
    { label: 'Top to Bottom', value: 'TB' },
    { label: 'Left to Right', value: 'LR' },
    { label: 'Bottom to Top', value: 'BT' },
    { label: 'Right to Left', value: 'RL' }
  ];

  // Crear nodos y edges a partir de las tareas y dependencias
  const { initialNodes, initialEdges } = useMemo(() => {
    if (tasks.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    const initialNodes = tasks.map((task) => ({
      id: task,
      type: 'custom',
      data: {
        label: task,
        isMinimal: results.minimalTasks.includes(task),
        isMaximal: results.maximalTasks.includes(task)
      },
      position: { x: 0, y: 0 }
    }));

    const initialEdges = dependencies.map((dep, index) => ({
      id: `${dep.from}-${dep.to}`,
      source: dep.from,
      target: dep.to,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4f46e5', strokeWidth: 2 },
      markerEnd: {
        type: 'arrowclosed',
        color: '#4f46e5'
      }
    }));

    return { initialNodes, initialEdges };
  }, [tasks, dependencies, results]);

  // Actualizar layout cuando cambian los datos o la dirección
  useEffect(() => {
    if (initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        layoutDirection
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [initialNodes, initialEdges, layoutDirection, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const resetLayout = () => {
    if (initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        layoutDirection
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="section-card">
        <h2 className="section-title">
          <i className="pi pi-sitemap"></i>
          Diagrama de Hasse
        </h2>
        <div className="empty-state">
          <i className="pi pi-sitemap"></i>
          <h3>No hay datos para visualizar</h3>
          <p>Agrega tareas y dependencias para ver el diagrama de Hasse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card">
      <h2 className="section-title">
        <i className="pi pi-sitemap"></i>
        Diagrama de Hasse
      </h2>

      {/* Controles del diagrama */}
      <Card className="mb-4">
        <div className="flex flex-wrap align-items-center gap-3">
          <div className="flex align-items-center gap-2">
            <label>Dirección:</label>
            <Dropdown
              value={layoutDirection}
              options={layoutOptions}
              onChange={(e) => setLayoutDirection(e.value)}
              className="w-10rem"
            />
          </div>
          <Button
            label="Reorganizar"
            icon="pi pi-refresh"
            onClick={resetLayout}
            size="small"
          />
        </div>

        {/* Leyenda */}
        <div className="mt-3 pt-3 border-top-1 border-gray-200">
          <h4 className="mb-2">Leyenda:</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex align-items-center gap-2">
              <div className="w-4 h-3 bg-green-100 border-2 border-green-500 border-round"></div>
              <span className="text-sm">Tareas Mínimas</span>
            </div>
            <div className="flex align-items-center gap-2">
              <div className="w-4 h-3 bg-red-100 border-2 border-red-500 border-round"></div>
              <span className="text-sm">Tareas Máximas</span>
            </div>
            <div className="flex align-items-center gap-2">
              <div className="w-4 h-3 bg-purple-100 border-2 border-purple-500 border-round"></div>
              <span className="text-sm">Mínima y Máxima</span>
            </div>
            <div className="flex align-items-center gap-2">
              <div className="w-4 h-3 bg-blue-100 border-2 border-blue-500 border-round"></div>
              <span className="text-sm">Tarea Regular</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Diagrama */}
      <div className="graph-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="top-right"
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.data.isMinimal && node.data.isMaximal) return '#a855f7';
              if (node.data.isMinimal) return '#10b981';
              if (node.data.isMaximal) return '#ef4444';
              return '#3b82f6';
            }}
            maskColor="rgb(240, 240, 240, 0.8)"
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Información adicional */}
      <Card className="mt-4">
        <div className="grid">
          <div className="col-12 md:col-3">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-blue-600">{tasks.length}</h4>
              <p className="text-sm text-gray-600">Total Tareas</p>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-green-600">{results.minimalTasks.length}</h4>
              <p className="text-sm text-gray-600">Tareas Mínimas</p>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-red-600">{results.maximalTasks.length}</h4>
              <p className="text-sm text-gray-600">Tareas Máximas</p>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-purple-600">{dependencies.length}</h4>
              <p className="text-sm text-gray-600">Dependencias</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HasseDiagram;