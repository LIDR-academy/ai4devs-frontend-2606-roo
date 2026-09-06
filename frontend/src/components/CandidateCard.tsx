import React from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import { StarFill, Star, ThreeDotsVertical } from 'react-bootstrap-icons';
import { BoardCandidate, InterviewStep } from '../services/positionService';
import { texts } from '../i18n/texts';

const MAX_SCORE = 5;

type Props = {
    candidate: BoardCandidate;
    /** Fase en la que está pintada la tarjeta ahora mismo */
    currentStep: InterviewStep;
    /** Todas las fases del proceso, para el menú de movimiento */
    steps: InterviewStep[];
    isDragging: boolean;
    onDragStart: (candidate: BoardCandidate) => void;
    onDragEnd: () => void;
    onMove: (candidate: BoardCandidate, targetStepId: number) => void;
};

const CandidateCard: React.FC<Props> = ({
    candidate,
    currentStep,
    steps,
    isDragging,
    onDragStart,
    onDragEnd,
    onMove
}) => {
    const filledStars = Math.max(0, Math.min(MAX_SCORE, Math.round(candidate.averageScore)));

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
        >
            <Card.Body className="p-2">
                <div className="d-flex justify-content-between align-items-start gap-2">
                    {/* El resumen completo va en un único texto para lector de pantalla:
                        leer "nombre / estrellas / fase" por separado resulta confuso. */}
                    <p className="kanban-card-name mb-0">
                        <span className="visually-hidden">
                            {texts.candidateCard.summary(
                                candidate.fullName,
                                candidate.averageScore,
                                currentStep.name
                            )}
                        </span>
                        <span aria-hidden="true">{candidate.fullName}</span>
                    </p>
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            as="button"
                            type="button"
                            className="kanban-card-menu"
                            id={`move-candidate-${candidate.applicationId}`}
                            aria-label={texts.candidateCard.moveMenuLabel(candidate.fullName)}
                        >
                            <ThreeDotsVertical aria-hidden="true" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Header>{texts.candidateCard.moveMenuHeader}</Dropdown.Header>
                            {steps.map(step => (
                                <Dropdown.Item
                                    key={step.id}
                                    as="button"
                                    type="button"
                                    disabled={step.id === currentStep.id}
                                    onClick={() => onMove(candidate, step.id)}
                                >
                                    {step.name}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <div
                    className="kanban-score mt-1"
                    aria-hidden="true"
                    title={texts.candidateCard.scoreLabel(candidate.averageScore)}
                >
                    {Array.from({ length: MAX_SCORE }, (_, index) =>
                        index < filledStars ? (
                            <StarFill key={index} className="kanban-star-filled" />
                        ) : (
                            <Star key={index} />
                        )
                    )}
                    <span className="ms-1">{candidate.averageScore}</span>
                </div>
            </Card.Body>
        </Card>
    );
};

// El tablero re-renderiza en cada arrastre; sin memo se repintarían todas las tarjetas.
export default React.memo(CandidateCard);
