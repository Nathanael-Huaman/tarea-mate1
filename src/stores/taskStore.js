import { create } from 'zustand';

const useTaskStore = create((set, get) => ({
  tasks: [],
  dependencies: [],
  results: {
    minimalTasks: [],
    maximalTasks: [],
    topologicalOrder: [],
    chains: [],
    notation: ""
  },

  // Agregar tarea
  addTask: (taskName) => {
    const { tasks } = get();
    if (!taskName.trim() || tasks.includes(taskName.trim())) return;
    
    set((state) => ({
      tasks: [...state.tasks, taskName.trim()]
    }));
  },

  // Eliminar tarea
  removeTask: (taskName) => {
    set((state) => ({
      tasks: state.tasks.filter(task => task !== taskName),
      dependencies: state.dependencies.filter(
        dep => dep.from !== taskName && dep.to !== taskName
      )
    }));
  },

  // Agregar dependencia
  addDependency: (from, to) => {
    const { dependencies, tasks } = get();
    
    if (!from || !to || from === to) return;
    if (!tasks.includes(from) || !tasks.includes(to)) return;
    if (dependencies.some(dep => dep.from === from && dep.to === to)) return;
    
    // Verificar que no cree ciclos
    if (get().wouldCreateCycle(from, to)) return;
    
    set((state) => ({
      dependencies: [...state.dependencies, { from, to }]
    }));
  },

  // Eliminar dependencia
  removeDependency: (from, to) => {
    set((state) => ({
      dependencies: state.dependencies.filter(
        dep => !(dep.from === from && dep.to === to)
      )
    }));
  },

  // Verificar si una nueva dependencia crearía un ciclo
  wouldCreateCycle: (from, to) => {
    const { dependencies } = get();
    
    // Crear grafo temporal con la nueva dependencia
    const tempDependencies = [...dependencies, { from, to }];
    
    // Verificar ciclos usando DFS
    const visited = new Set();
    const recStack = new Set();
    
    const hasCycle = (node) => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;
      
      visited.add(node);
      recStack.add(node);
      
      const children = tempDependencies
        .filter(dep => dep.from === node)
        .map(dep => dep.to);
        
      for (const child of children) {
        if (hasCycle(child)) return true;
      }
      
      recStack.delete(node);
      return false;
    };
    
    const allNodes = [...new Set([
      ...tempDependencies.map(d => d.from),
      ...tempDependencies.map(d => d.to)
    ])];
    
    return allNodes.some(node => hasCycle(node));
  },

  // Generar tareas aleatorias
  generateRandomTasks: () => {
    const taskNames = [
      'Análisis', 'Diseño', 'Desarrollo', 'Testing', 'Deploy',
      'Documentación', 'Revisión', 'Planificación', 'Investigación',
      'Implementación', 'Validación', 'Optimización', 'Integración',
      'Configuración', 'Mantenimiento'
    ];
    
    const numTasks = Math.floor(Math.random() * 6) + 5; // 5-10 tareas
    const selectedTasks = taskNames
      .sort(() => Math.random() - 0.5)
      .slice(0, numTasks);
    
    const dependencies = [];
    const numDeps = Math.floor(Math.random() * (numTasks - 1)) + 1;
    
    for (let i = 0; i < numDeps; i++) {
      const from = selectedTasks[Math.floor(Math.random() * selectedTasks.length)];
      const to = selectedTasks[Math.floor(Math.random() * selectedTasks.length)];
      
      if (from !== to && !dependencies.some(d => d.from === from && d.to === to)) {
        dependencies.push({ from, to });
      }
    }
    
    set({
      tasks: selectedTasks,
      dependencies: dependencies.filter(dep => {
        // Solo mantener dependencias que no creen ciclos
        const tempStore = { ...get(), dependencies: [] };
        tempStore.dependencies = dependencies.filter(d => d !== dep);
        return !get().wouldCreateCycle(dep.from, dep.to);
      })
    });
  },

  // Limpiar todo
  clearAll: () => {
    set({
      tasks: [],
      dependencies: [],
      results: {
        minimalTasks: [],
        maximalTasks: [],
        topologicalOrder: [],
        chains: [],
        notation: ""
      }
    });
  },

  // Calcular resultados del orden parcial
  calculateResults: () => {
    const { tasks, dependencies } = get();
    
    if (tasks.length === 0) {
      set((state) => ({
        results: {
          minimalTasks: [],
          maximalTasks: [],
          topologicalOrder: [],
          chains: [],
          notation: ""
        }
      }));
      return;
    }

    // Tareas mínimas (sin dependencias entrantes)
    const minimalTasks = tasks.filter(task => 
      !dependencies.some(dep => dep.to === task)
    );

    // Tareas máximas (sin dependencias salientes)
    const maximalTasks = tasks.filter(task => 
      !dependencies.some(dep => dep.from === task)
    );

    // Orden topológico usando algoritmo de Kahn
    const topologicalOrder = get().calculateTopologicalOrder();

    // Encontrar cadenas
    const chains = get().findChains();

    // Notación de conjuntos
    const notation = `{${dependencies.map(dep => `(${dep.from}, ${dep.to})`).join(', ')}}`;

    set((state) => ({
      results: {
        minimalTasks,
        maximalTasks,
        topologicalOrder,
        chains,
        notation
      }
    }));
  },

  // Calcular orden topológico
  calculateTopologicalOrder: () => {
    const { tasks, dependencies } = get();
    
    if (tasks.length === 0) return [];
    
    const inDegree = {};
    const adjList = {};
    
    // Inicializar
    tasks.forEach(task => {
      inDegree[task] = 0;
      adjList[task] = [];
    });
    
    // Construir grafo
    dependencies.forEach(dep => {
      adjList[dep.from].push(dep.to);
      inDegree[dep.to]++;
    });
    
    // Algoritmo de Kahn
    const queue = tasks.filter(task => inDegree[task] === 0);
    const result = [];
    
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);
      
      adjList[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    return result;
  },

  // Encontrar cadenas
  findChains: () => {
    const { tasks, dependencies } = get();
    const chains = [];
    
    // Encontrar todas las cadenas posibles
    const findChainsFromNode = (node, currentChain, visited) => {
      const newChain = [...currentChain, node];
      
      const successors = dependencies
        .filter(dep => dep.from === node && !visited.has(dep.to))
        .map(dep => dep.to);
      
      if (successors.length === 0) {
        if (newChain.length >= 2) {
          chains.push(newChain);
        }
      } else {
        successors.forEach(successor => {
          const newVisited = new Set(visited);
          newVisited.add(node);
          findChainsFromNode(successor, newChain, newVisited);
        });
      }
    };
    
    // Comenzar desde tareas mínimas
    const minimalTasks = tasks.filter(task => 
      !dependencies.some(dep => dep.to === task)
    );
    
    minimalTasks.forEach(task => {
      findChainsFromNode(task, [], new Set());
    });
    
    // Remover cadenas duplicadas y ordenar por longitud
    const uniqueChains = chains
      .filter((chain, index, self) => 
        index === self.findIndex(c => JSON.stringify(c) === JSON.stringify(chain))
      )
      .sort((a, b) => b.length - a.length);
    
    return uniqueChains.slice(0, 5); // Máximo 5 cadenas
  },

  // Verificar si existe cadena de tamaño dado
  hasChainOfSize: (size) => {
    const chains = get().results.chains;
    return chains.some(chain => chain.length === size);
  }
}));

export default useTaskStore;