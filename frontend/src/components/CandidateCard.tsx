import React from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import { StarFill, Star } from 'react-bootstrap-icons';
import { BoardCandidate, InterviewStep } from '../services/positionService';

const MAX_SCORE = 5;

type Props = {
    candidate: BoardCandidate;
    /** Fase en la que está pintada la tarjeta ahora mismo */
    currentStepId: number;
    /** Todas las fases del proceso, para el menú de movimiento en móvil */
    steps: InterviewStep[];
    isDragging: boolean;
    onDragStart: (candidate: BoardCandidate) => void;
    onDragEnd: () => void;
    onMove: (candidate: BoardCandidate, targetStepId: number) => void;
};

const CandidateCard: React.FC<Props> = ({
    candidate,
    currentStepId,
    steps,
    isDragging,
    onDragStart,
    onDragEnd,
    onMove
}) => {
    const score = Math.round(candidate.averageScore ?? 0);

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        // Necesario para que Firefox inicie el arrastre
        event.dataTransfer.setData('text/plain', String(candidate.applicationId));
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(candidate);
    };

    return (
        <Card
            className={`kanban-card shadow-sm${isDragging ? ' is-dragging' : ''}`}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            aria-label={`${candidate.fullName}, puntuación media ${candidate.averageScore}`}
        >
            <Card.Body className="p-2">
                <div className="d-flex justify-content-between align-items-start gap-2">
                    <p className="kanban-card-name">{candidate.fullName}</p>
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant="link"
                            size="sm"
                            className="p-0 text-secondary text-decoration-none"
                            id={`move-candidate-${candidate.applicationId}`}
                            aria-label={`Mover a ${candidate.fullName} de fase`}
                        />
                        <Dropdown.Menu>
                            <Dropdown.Header>Mover a</Dropdown.Header>
                            {steps.map(step => (
                                <Dropdown.Item
                                    key={step.id}
                                    disabled={step.id === currentStepId}
                                    onClick={() => onMove(candidate, step.id)}
                                >
                                    {step.name}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <div className="kanban-score mt-1">
                    {Array.from({ length: MAX_SCORE }, (_, index) =>
                        index < score ? (
                            <StarFill key={index} className="text-warning" />
                        ) : (
                            <Star key={index} />
                        )
                    )}
                    <span className="ms-1">{candidate.averageScore ?? 0}</span>
                </div>
            </Card.Body>
        </Card>
    );
};

export default CandidateCard;
