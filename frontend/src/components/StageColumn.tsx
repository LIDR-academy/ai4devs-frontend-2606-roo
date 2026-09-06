import React, { useState } from 'react';
import { Badge } from 'react-bootstrap';
import CandidateCard from './CandidateCard';
import { BoardCandidate, InterviewStep } from '../services/positionService';
import { texts } from '../i18n/texts';

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

    const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
        // Sin preventDefault el navegador no permite soltar aquí
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (!isOver) setIsOver(true);
    };

    const handleDrop = (event: React.DragEvent<HTMLElement>) => {
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
            aria-labelledby={`stage-heading-${step.id}`}
        >
            <header className="kanban-column-header">
                <h3 className="kanban-column-title" id={`stage-heading-${step.id}`}>
                    {step.name}
                </h3>
                <Badge bg="secondary" pill>
                    <span className="visually-hidden">
                        {texts.stageColumn.candidateCount(candidates.length)}
                    </span>
                    <span aria-hidden="true">{candidates.length}</span>
                </Badge>
            </header>
            {/* role="list" explícito: Safari/VoiceOver retira la semántica de lista cuando se
                quita el marcador con list-style: none, así que aquí el rol redundante no lo es. */}
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
            <ul className="kanban-column-body" role="list">
                {candidates.map(candidate => (
                    <li key={candidate.applicationId}>
                        <CandidateCard
                            candidate={candidate}
                            currentStep={step}
                            steps={steps}
                            isDragging={draggingApplicationId === candidate.applicationId}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onMove={onMove}
                        />
                    </li>
                ))}
                {candidates.length === 0 && (
                    <li className="kanban-empty">{texts.stageColumn.empty}</li>
                )}
            </ul>
        </section>
    );
};

export default StageColumn;
