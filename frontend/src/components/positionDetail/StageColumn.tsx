import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CandidateCard as CandidateCardType, InterviewStep } from '../../types/position';
import CandidateCard from './CandidateCard';

interface StageColumnProps {
  step: InterviewStep;
  candidates: CandidateCardType[];
}

/**
 * Columna del kanban que representa una fase del proceso de entrevistas.
 * Actúa como zona donde soltar (droppable); su id es el id del paso.
 */
const StageColumn: React.FC<StageColumnProps> = ({ step, candidates }) => {
  const { setNodeRef, isOver } = useDroppable({ id: step.id });

  return (
    <section
      ref={setNodeRef}
      className={`stage-column bg-light rounded p-3 ${isOver ? 'stage-column--over' : ''}`}
      aria-label={`Fase ${step.name}`}
    >
      <h2 className="stage-column__title h5 mb-3">{step.name}</h2>
      {candidates.map((candidate) => (
        <CandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </section>
  );
};

export default StageColumn;
