import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { Link, useParams } from 'react-router-dom';
import StageColumn from './StageColumn';
import { usePositionBoard } from '../hooks/usePositionBoard';
import { BoardCandidate } from '../services/positionService';
import { texts } from '../i18n/texts';
import './PositionDetail.css';

/**
 * Vista de detalle de una posición: tablero kanban con una columna por fase del
 * proceso de contratación. La carga y el movimiento de candidatos viven en
 * `usePositionBoard`; aquí solo queda la presentación y el estado del arrastre.
 */
const PositionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const {
        positionName,
        steps,
        candidates,
        loading,
        loadError,
        statusMessage,
        moveError,
        reload,
        moveCandidate,
        dismissMoveError
    } = usePositionBoard(id);

    const [draggingCandidate, setDraggingCandidate] = useState<BoardCandidate | null>(null);

    // Un solo recorrido para agrupar, en lugar de un filter por columna en cada render
    const candidatesByStep = useMemo(() => {
        const grouped = new Map<number, BoardCandidate[]>(steps.map(step => [step.id, []]));
        candidates.forEach(candidate => grouped.get(candidate.stepId)?.push(candidate));
        return grouped;
    }, [candidates, steps]);

    const handleDragStart = useCallback(
        (candidate: BoardCandidate) => setDraggingCandidate(candidate),
        []
    );

    const handleDragEnd = useCallback(() => setDraggingCandidate(null), []);

    const handleDrop = useCallback(
        (targetStepId: number) => {
            if (draggingCandidate) moveCandidate(draggingCandidate, targetStepId);
            setDraggingCandidate(null);
        },
        [draggingCandidate, moveCandidate]
    );

    return (
        <Container as="main" className="mt-4 mb-5">
            <div className="d-flex align-items-center gap-2 mb-2">
                <Link
                    to="/positions"
                    className="kanban-back-link"
                    aria-label={texts.positionDetail.backToList}
                >
                    <ArrowLeft size={24} aria-hidden="true" />
                </Link>
                <h2 className="mb-0">{positionName || texts.positionDetail.fallbackTitle}</h2>
            </div>
            <p className="kanban-hint">{texts.positionDetail.dragHint}</p>

            {/* Región de estado: anuncia los movimientos a lectores de pantalla sin robar el foco */}
            <div aria-live="polite" className="visually-hidden">
                {statusMessage}
            </div>

            {moveError && (
                <Alert variant="warning" dismissible onClose={dismissMoveError} role="alert">
                    {moveError}
                </Alert>
            )}

            {loading && (
                <div className="text-center py-5" aria-busy="true">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">{texts.positionDetail.loading}</span>
                    </Spinner>
                </div>
            )}

            {!loading && loadError && (
                <Alert variant="danger" role="alert">
                    <p className="mb-2">{loadError}</p>
                    <Button variant="outline-danger" size="sm" onClick={reload}>
                        {texts.positionDetail.retry}
                    </Button>
                </Alert>
            )}

            {!loading && !loadError && steps.length === 0 && (
                <Alert variant="info">{texts.positionDetail.noSteps}</Alert>
            )}

            {!loading && !loadError && steps.length > 0 && (
                // role="group": un aria-label sobre un div sin rol no lo expone la mayoría
                // de tecnologías de apoyo.
                <div className="kanban-board" role="group" aria-label={texts.positionDetail.board}>
                    {steps.map(step => (
                        <StageColumn
                            key={step.id}
                            step={step}
                            steps={steps}
                            candidates={candidatesByStep.get(step.id) ?? []}
                            draggingApplicationId={draggingCandidate?.applicationId ?? null}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDropCandidate={handleDrop}
                            onMove={moveCandidate}
                        />
                    ))}
                </div>
            )}
        </Container>
    );
};

export default PositionDetail;
