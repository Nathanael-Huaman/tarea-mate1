import React, { useEffect } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import TaskInput from './components/TaskInput';
import ResultsDisplay from './components/ResultsDisplay';
import HasseDiagram from './components/HasseDiagram';
import useTaskStore from './stores/taskStore';
import './index.css';

const App = () => {
  const { calculateResults } = useTaskStore();
  const toastRef = React.useRef(null);

  useEffect(() => {
    // Calcular resultados iniciales
    calculateResults();
  }, [calculateResults]);

  const primeReactConfig = {
    ripple: true,
    inputStyle: 'outlined',
    appendTo: 'self'
  };

  return (
    <PrimeReactProvider value={primeReactConfig}>
      <div className="app-container">
        {/* Header */}
        <div className="app-header">
          <h1>Sistema de Orden Parcial</h1>
          <p>Análisis y visualización de dependencias entre tareas</p>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <TabView>
            {/* Pestaña de gestión de tareas */}
            <TabPanel 
              header="Gestión de Tareas" 
              leftIcon="pi pi-plus-circle mr-2"
            >
              <TaskInput />
            </TabPanel>

            {/* Pestaña de resultados */}
            <TabPanel 
              header="Análisis y Resultados" 
              leftIcon="pi pi-chart-bar mr-2"
            >
              <ResultsDisplay />
            </TabPanel>

            {/* Pestaña del diagrama de Hasse */}
            <TabPanel 
              header="Diagrama de Hasse" 
              leftIcon="pi pi-sitemap mr-2"
            >
              <HasseDiagram />
            </TabPanel>
          </TabView>
        </div>

        {/* Componentes globales */}
        <ConfirmDialog />
        <Toast ref={toastRef} />
      </div>
    </PrimeReactProvider>
  );
};

export default App;