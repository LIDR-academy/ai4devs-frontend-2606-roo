import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { usePositionKanban } from './usePositionKanban';
import StageColumn from './StageColumn';
import './PositionDetail.css';

/**
 * Contenido interno de la página de detalle de una posición.
 * Muestra un tablero kanban con una columna por fase del proceso de entrevistas
 * y permite mover un candidato de fase arrastrando su tarjeta.
 *
 * El layout global (menú superior, footer) lo aporta la estructura de la página.
 */
const PositionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const positionId = Number(id);

  const {
    positionName,
    steps,
    candidatesByStepId,
    loading,
    error,
    moveCandidate,
    clearError,
  } = usePositionKanban(positionId);

  // Un pequeño umbral de arrastre evita disparar el drag en clics simples.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const candidateId = Number(active.id);
    const destStepId = Number(over.id);
    const applicationId = Number(active.data.current?.applicationId);
    if (Number.isNaN(applicationId)) return;
    void moveCandidate(candidateId, applicationId, destStepId);
  };

  if (loading) {
    return (
      <div className="position-detail text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando…</span>
        </Spinner>
      </div>
    );
  }

  if (error && steps.length === 0) {
    return (
      <div className="position-detail py-4">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="position-detail py-4">
      <div className="position-detail__header mb-4">
        <Link
          to="/positions"
          className="position-detail__back"
          aria-label="Volver al listado de posiciones"
        >
          <ArrowLeft size={28} />
        </Link>
        <h1 className="position-detail__title mb-0">{positionName} Position</h1>
      </div>

      {error && (
        <Alert variant="warning" dismissible onClose={clearError}>
          {error}
        </Alert>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="position-detail__board">
          {steps.map((step) => (
            <StageColumn
              key={step.id}
              step={step}
              candidates={candidatesByStepId.get(step.id) ?? []}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default PositionDetail;
