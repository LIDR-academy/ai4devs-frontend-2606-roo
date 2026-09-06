import React from 'react';
import { Card } from 'react-bootstrap';
import { useDraggable } from '@dnd-kit/core';
import { CandidateCard as CandidateCardType } from '../../types/position';
import ScoreIndicator from './ScoreIndicator';

interface CandidateCardProps {
  candidate: CandidateCardType;
}

/**
 * Tarjeta de candidato arrastrable.
 * El id del draggable es el id del candidato; los datos de la aplicación
 * viajan en `data` para que el contenedor pueda resolver la llamada a la API.
 */
const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: candidate.id,
      data: { applicationId: candidate.applicationId },
    });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="candidate-card shadow-sm mb-3"
      {...attributes}
      {...listeners}
    >
      <Card.Body className="p-3">
        <Card.Title as="h6" className="mb-2">
          {candidate.fullName}
        </Card.Title>
        <ScoreIndicator score={candidate.averageScore} />
      </Card.Body>
    </Card>
  );
};

export default CandidateCard;
