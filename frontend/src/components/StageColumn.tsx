import React, { useState } from 'react';
import { Badge } from 'react-bootstrap';
import CandidateCard from './CandidateCard';
import { BoardCandidate, InterviewStep } from '../services/positionService';

type Props = {
    step: InterviewStep;
    steps: InterviewStep[];
    candidates: BoardCandidate[];
    draggingApplicationId: number | null;
    onDragStart: (candidate: BoardCandidate) => void;
    onDragEnd: () => void;
    onDropCandidate: (targetStepId: number) => void;
    onMove: (candidate: BoardCandidate, targetStepId: number) => void;
};

const StageColumn: React.FC<Props> = ({
    step,
    steps,
    candidates,
    draggingApplicationId,
    onDragStart,
    onDragEnd,
    onDropCandidate,
    onMove
}) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        // Sin preventDefault el navegador no permite soltar aquí
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (!isOver) setIsOver(true);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsOver(false);
        onDropCandidate(step.id);
    };

    return (
        <section
            className={`kanban-column${isOver ? ' is-drop-target' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsOver(false)}
            onDrop={handleDrop}
            aria-label={`Fase ${step.name}`}
        >
            <header className="kanban-column-header">
                <h3 className="kanban-column-title">{step.name}</h3>
                <Badge bg="secondary" pill>
                    {candidates.length}
                </Badge>
            </header>
            <div className="kanban-column-body">
                {candidates.map(candidate => (
                    <CandidateCard
                        key={candidate.applicationId}
                        candidate={candidate}
                        currentStepId={step.id}
                        steps={steps}
                        isDragging={draggingApplicationId === candidate.applicationId}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onMove={onMove}
                    />
                ))}
                {candidates.length === 0 && (
                    <p className="kanban-empty mb-0">Sin candidatos</p>
                )}
            </div>
        </section>
    );
};

export default StageColumn;
