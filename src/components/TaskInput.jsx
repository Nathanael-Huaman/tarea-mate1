import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { confirmDialog } from 'primereact/confirmdialog';
import useTaskStore from '../stores/taskStore';

const TaskInput = () => {
  const {
    tasks,
    dependencies,
    addTask,
    removeTask,
    addDependency,
    removeDependency,
    generateRandomTasks,
    clearAll,
    calculateResults
  } = useTaskStore();

  const [newTask, setNewTask] = useState('');
  const [fromTask, setFromTask] = useState('');
  const [toTask, setToTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTask(newTask);
      setNewTask('');
      calculateResults();
    }
  };

  const handleRemoveTask = (taskName) => {
    confirmDialog({
      message: `¿Estás seguro de eliminar la tarea "${taskName}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        removeTask(taskName);
        calculateResults();
      }
    });
  };

  const handleAddDependency = () => {
    if (fromTask && toTask) {
      addDependency(fromTask, toTask);
      setFromTask('');
      setToTask('');
      calculateResults();
    }
  };

  const handleRemoveDependency = (from, to) => {
    removeDependency(from, to);
    calculateResults();
  };

  const handleGenerateRandom = () => {
    confirmDialog({
      message: '¿Deseas generar un nuevo conjunto de tareas aleatorias? Esto eliminará las tareas actuales.',
      header: 'Generar tareas aleatorias',
      icon: 'pi pi-question',
      accept: () => {
        generateRandomTasks();
        calculateResults();
      }
    });
  };

  const handleClearAll = () => {
    confirmDialog({
      message: '¿Estás seguro de eliminar todas las tareas y dependencias?',
      header: 'Limpiar todo',
      icon: 'pi pi-exclamation-triangle',
      accept: clearAll
    });
  };

  const taskOptions = tasks.map(task => ({ label: task, value: task }));

  return (
    <div className="section-card">
      <h2 className="section-title">
        <i className="pi pi-plus-circle"></i>
        Gestión de Tareas
      </h2>

      {/* Agregar nueva tarea */}
      <Card title="Nueva Tarea" className="mb-4">
        <div className="p-inputgroup">
          <InputText
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nombre de la tarea"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <Button
            icon="pi pi-plus"
            onClick={handleAddTask}
            disabled={!newTask.trim()}
            tooltip="Agregar tarea"
          />
        </div>
      </Card>

      {/* Lista de tareas */}
      {tasks.length > 0 && (
        <Card title="Tareas Actuales" className="mb-4">
          <div className="flex flex-wrap gap-2">
            {tasks.map((task) => (
              <Chip
                key={task}
                label={task}
                removable
                onRemove={() => handleRemoveTask(task)}
                className="p-2"
              />
            ))}
          </div>
        </Card>
      )}

      {/* Agregar dependencias */}
      {tasks.length >= 2 && (
        <Card title="Dependencias" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-4">
              <label className="block mb-2">Tarea prerequisito:</label>
              <Dropdown
                value={fromTask}
                options={taskOptions}
                onChange={(e) => setFromTask(e.value)}
                placeholder="Seleccionar tarea"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block mb-2">Tarea dependiente:</label>
              <Dropdown
                value={toTask}
                options={taskOptions.filter(opt => opt.value !== fromTask)}
                onChange={(e) => setToTask(e.value)}
                placeholder="Seleccionar tarea"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block mb-2">&nbsp;</label>
              <Button
                label="Agregar Dependencia"
                icon="pi pi-arrow-right"
                onClick={handleAddDependency}
                disabled={!fromTask || !toTask}
                className="w-full"
              />
            </div>
          </div>

          {/* Lista de dependencias */}
          {dependencies.length > 0 && (
            <div className="mt-4">
              <Divider />
              <h4>Dependencias actuales:</h4>
              <div className="mt-2">
                {dependencies.map((dep, index) => (
                  <div key={index} className="task-item">
                    <span className="dependency-badge">
                      {dep.from} → {dep.to}
                    </span>
                    <Button
                      icon="pi pi-times"
                      className="p-button-text p-button-sm p-button-danger"
                      onClick={() => handleRemoveDependency(dep.from, dep.to)}
                      tooltip="Eliminar dependencia"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Acciones */}
      <Card title="Acciones">
        <div className="flex flex-wrap gap-2">
          <Button
            label="Generar Aleatorio"
            icon="pi pi-refresh"
            onClick={handleGenerateRandom}
            className="p-button-success"
          />
          <Button
            label="Limpiar Todo"
            icon="pi pi-trash"
            onClick={handleClearAll}
            className="p-button-danger"
            disabled={tasks.length === 0}
          />
          <Button
            label="Recalcular"
            icon="pi pi-calculator"
            onClick={calculateResults}
            disabled={tasks.length === 0}
          />
        </div>
      </Card>
    </div>
  );
};

export default TaskInput;