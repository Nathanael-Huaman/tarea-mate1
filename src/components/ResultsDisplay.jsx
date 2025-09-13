import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Accordion, AccordionTab } from 'primereact/accordion';
import useTaskStore from '../stores/taskStore';

const ResultsDisplay = () => {
  const { results, tasks, hasChainOfSize } = useTaskStore();
  const [chainSize, setChainSize] = useState(3);
  const [chainCheckResult, setChainCheckResult] = useState(null);

  if (tasks.length === 0) {
    return (
      <div className="section-card">
        <div className="empty-state">
          <i className="pi pi-info-circle"></i>
          <h3>No hay tareas definidas</h3>
          <p>Agrega algunas tareas para ver los resultados del análisis</p>
        </div>
      </div>
    );
  }

  const checkChainExists = () => {
    const exists = hasChainOfSize(chainSize);
    setChainCheckResult(exists);
    return exists;
  };

  return (
    <div className="section-card">
      <h2 className="section-title">
        <i className="pi pi-chart-bar"></i>
        Análisis del Orden Parcial
      </h2>

      <Accordion multiple activeIndex={[0, 1, 2, 3]}>
        {/* Notación de conjuntos */}
        <AccordionTab header="Notación de Conjuntos" leftIcon="pi pi-code">
          <Card>
            <div className="text-center p-3">
              <h4>Relación de Orden Parcial:</h4>
              <div className="mt-2 p-3 bg-gray-50 border-round text-xl font-mono">
                {results.notation || "∅"}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Cada par (a,b) indica que la tarea 'a' debe completarse antes que 'b'
              </p>
            </div>
          </Card>
        </AccordionTab>

        {/* Elementos mínimos y máximos */}
        <AccordionTab header="Elementos Extremos" leftIcon="pi pi-sort-alt">
          <div className="result-grid">
            <Card title="Tareas Mínimas" className="result-card">
              <p className="mb-2">Tareas sin prerequisitos (pueden iniciarse primero):</p>
              <div className="flex flex-wrap gap-1">
                {results.minimalTasks.length > 0 ? (
                  results.minimalTasks.map((task) => (
                    <Tag key={task} value={task} severity="success" />
                  ))
                ) : (
                  <Tag value="Ninguna" severity="warning" />
                )}
              </div>
            </Card>

            <Card title="Tareas Máximas" className="result-card">
              <p className="mb-2">Tareas sin dependientes (pueden ser las últimas):</p>
              <div className="flex flex-wrap gap-1">
                {results.maximalTasks.length > 0 ? (
                  results.maximalTasks.map((task) => (
                    <Tag key={task} value={task} severity="info" />
                  ))
                ) : (
                  <Tag value="Ninguna" severity="warning" />
                )}
              </div>
            </Card>
          </div>
        </AccordionTab>

        {/* Orden topológico */}
        <AccordionTab header="Orden Topológico" leftIcon="pi pi-list">
          <Card>
            <p className="mb-3">Orden válido de ejecución de las tareas:</p>
            {results.topologicalOrder.length > 0 ? (
              <div className="flex flex-wrap gap-2 align-items-center">
                {results.topologicalOrder.map((task, index) => (
                  <React.Fragment key={task}>
                    <Tag value={`${index + 1}. ${task}`} severity="help" />
                    {index < results.topologicalOrder.length - 1 && (
                      <i className="pi pi-arrow-right text-gray-400"></i>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <Message severity="warn" text="No se pudo calcular un orden topológico válido" />
            )}
            <div className="mt-3 p-3 bg-blue-50 border-round">
              <p className="text-sm text-blue-800">
                <i className="pi pi-info-circle mr-1"></i>
                Este orden garantiza que todas las dependencias se respeten durante la ejecución.
              </p>
            </div>
          </Card>
        </AccordionTab>

        {/* Cadenas */}
        <AccordionTab header="Cadenas Encontradas" leftIcon="pi pi-link">
          <Card>
            {/* Verificador de cadenas */}
            <div className="mb-4 p-3 border-1 border-gray-200 border-round">
              <h4 className="mb-2">Verificar existencia de cadena:</h4>
              <div className="flex align-items-center gap-2 flex-wrap">
                <span className="white-space-nowrap">Tamaño de cadena:</span>
                <InputNumber
                  value={chainSize}
                  onValueChange={(e) => setChainSize(e.value)}
                  min={1}
                  max={tasks.length}
                  className="w-5rem"
                />
                <Button
                  label="Verificar"
                  icon="pi pi-search"
                  onClick={checkChainExists}
                  size="small"
                />
                {chainCheckResult !== null && (
                  <Message
                    severity={chainCheckResult ? "success" : "warn"}
                    text={
                      chainCheckResult
                        ? `✓ Sí existe una cadena de tamaño ${chainSize}`
                        : `✗ No existe una cadena de tamaño ${chainSize}`
                    }
                    className="ml-2"
                  />
                )}
              </div>
            </div>

            {/* Lista de cadenas */}
            <div>
              <h4 className="mb-3">Cadenas principales encontradas:</h4>
              {results.chains && results.chains.length > 0 ? (
                <div className="grid">
                  {results.chains.map((chain, index) => (
                    <div key={index} className="col-12 md:col-6 lg:col-4">
                      <div className="p-3 border-1 border-gray-200 border-round bg-white shadow-1">
                        <div className="flex justify-content-between align-items-center mb-2">
                          <h5 className="m-0 text-primary">Cadena {index + 1}</h5>
                          <Tag value={`Longitud: ${chain.length}`} severity="secondary" />
                        </div>
                        <div className="flex flex-wrap gap-1 align-items-center">
                          {chain.map((task, taskIndex) => (
                            <React.Fragment key={taskIndex}>
                              <Tag value={task} severity="secondary" className="text-xs" />
                              {taskIndex < chain.length - 1 && (
                                <i className="pi pi-arrow-right text-xs text-gray-400"></i>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <i className="pi pi-info-circle text-4xl text-gray-400 mb-2"></i>
                  <p className="text-gray-600">No se encontraron cadenas significativas</p>
                  <p className="text-sm text-gray-500">Las cadenas aparecen cuando hay dependencias secuenciales entre tareas</p>
                </div>
              )}
            </div>

            {/* Información sobre cadenas */}
            <div className="mt-4 p-3 bg-yellow-50 border-round">
              <h5 className="text-yellow-800 mb-2">
                <i className="pi pi-lightbulb mr-1"></i>
                ¿Qué son las cadenas?
              </h5>
              <p className="text-sm text-yellow-800 m-0">
                Una cadena es una secuencia de tareas donde cada una depende de la anterior. 
                Las cadenas más largas representan rutas críticas en tu proyecto.
              </p>
            </div>
          </Card>
        </AccordionTab>
      </Accordion>

      {/* Resumen estadístico */}
      <Card title="Resumen Estadístico" className="mt-4">
        <div className="grid">
          <div className="col-6 md:col-3">
            <div className="text-center p-2">
              <i className="pi pi-list text-3xl text-blue-500 mb-2"></i>
              <h4 className="text-xl font-bold text-blue-600 m-0">{tasks.length}</h4>
              <p className="text-sm text-gray-600 m-0">Total Tareas</p>
            </div>
          </div>
          <div className="col-6 md:col-3">
            <div className="text-center p-2">
              <i className="pi pi-play text-3xl text-green-500 mb-2"></i>
              <h4 className="text-xl font-bold text-green-600 m-0">{results.minimalTasks?.length || 0}</h4>
              <p className="text-sm text-gray-600 m-0">Tareas Iniciales</p>
            </div>
          </div>
          <div className="col-6 md:col-3">
            <div className="text-center p-2">
              <i className="pi pi-stop text-3xl text-red-500 mb-2"></i>
              <h4 className="text-xl font-bold text-red-600 m-0">{results.maximalTasks?.length || 0}</h4>
              <p className="text-sm text-gray-600 m-0">Tareas Finales</p>
            </div>
          </div>
          <div className="col-6 md:col-3">
            <div className="text-center p-2">
              <i className="pi pi-link text-3xl text-purple-500 mb-2"></i>
              <h4 className="text-xl font-bold text-purple-600 m-0">{results.chains?.length || 0}</h4>
              <p className="text-sm text-gray-600 m-0">Cadenas Encontradas</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultsDisplay;