import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { Link, useParams } from 'react-router-dom';
import StageColumn from './StageColumn';
import {
    BoardCandidate,
    Candidate,
    InterviewStep,
    getCandidatesByPosition,
    getInterviewFlowByPosition,
    updateCandidateStage
} from '../services/positionService';
import './PositionDetail.css';

const sortSteps = (steps: InterviewStep[]): InterviewStep[] =>
    [...steps].sort((a, b) => a.orderIndex - b.orderIndex);

/**
 * El endpoint de candidatos devuelve la fase por nombre, mientras que las columnas
 * y el PUT trabajan con el id de la fase. Aquí se resuelve el nombre a id; si no
 * hay coincidencia, el candidato cae en la primera fase del proceso.
 */
const toBoardCandidates = (candidates: Candidate[], steps: InterviewStep[]): BoardCandidate[] => {
    const stepIdByName = new Map(steps.map(step => [step.name, step.id]));
    const fallbackStepId = steps[0]?.id;

    return candidates.map(candidate => ({
        ...candidate,
        stepId: stepIdByName.get(candidate.currentInterviewStep) ?? fallbackStepId
    }));
};

const PositionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [positionName, setPositionName] = useState('');
    const [steps, setSteps] = useState<InterviewStep[]>([]);
    const [candidates, setCandidates] = useState<BoardCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [draggingCandidate, setDraggingCandidate] = useState<BoardCandidate | null>(null);

    const loadPosition = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setLoadError(null);

        try {
            const [flow, candidateList] = await Promise.all([
                getInterviewFlowByPosition(id),
                getCandidatesByPosition(id)
            ]);

            const orderedSteps = sortSteps(flow.interviewFlow.interviewSteps);
            setPositionName(flow.positionName);
            setSteps(orderedSteps);
            setCandidates(toBoardCandidates(candidateList, orderedSteps));
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : 'Error cargando la posición');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadPosition();
    }, [loadPosition]);

    /** Mueve la tarjeta de forma optimista y revierte si el backend falla. */
    const moveCandidate = useCallback(
        async (candidate: BoardCandidate, targetStepId: number) => {
            const originStepId = candidate.stepId;
            if (originStepId === targetStepId) return;

            setUpdateError(null);
            setCandidates(current =>
                current.map(item =>
                    item.applicationId === candidate.applicationId
                        ? { ...item, stepId: targetStepId }
                        : item
                )
            );

            try {
                await updateCandidateStage(candidate.id, candidate.applicationId, targetStepId);
            } catch (error) {
                setCandidates(current =>
                    current.map(item =>
                        item.applicationId === candidate.applicationId
                            ? { ...item, stepId: originStepId }
                            : item
                    )
                );
                setUpdateError(
                    `No se pudo mover a ${candidate.fullName}: ${
                        error instanceof Error ? error.message : 'error desconocido'
                    }`
                );
            }
        },
        []
    );

    const handleDrop = useCallback(
        (targetStepId: number) => {
            if (draggingCandidate) {
                moveCandidate(draggingCandidate, targetStepId);
            }
            setDraggingCandidate(null);
        },
        [draggingCandidate, moveCandidate]
    );

    const handleDragStart = useCallback(
        (candidate: BoardCandidate) => setDraggingCandidate(candidate),
        []
    );

    return (
        <Container className="mt-4 mb-5">
            <div className="d-flex align-items-center gap-2 mb-4">
                <Link
                    to="/positions"
                    className="btn btn-link text-decoration-none p-0 text-secondary"
                    aria-label="Volver al listado de posiciones"
                >
                    <ArrowLeft size={28} />
                </Link>
                <h2 className="mb-0">{positionName || 'Posición'}</h2>
            </div>

            {updateError && (
                <Alert variant="warning" dismissible onClose={() => setUpdateError(null)}>
                    {updateError}
                </Alert>
            )}

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando…</span>
                    </Spinner>
                </div>
            )}

            {!loading && loadError && (
                <Alert variant="danger">
                    <p className="mb-2">{loadError}</p>
                    <Button variant="outline-danger" size="sm" onClick={loadPosition}>
                        Reintentar
                    </Button>
                </Alert>
            )}

            {!loading && !loadError && (
                <div className="kanban-board">
                    {steps.map(step => (
                        <StageColumn
                            key={step.id}
                            step={step}
                            steps={steps}
                            candidates={candidates.filter(candidate => candidate.stepId === step.id)}
                            draggingApplicationId={draggingCandidate?.applicationId ?? null}
                            onDragStart={handleDragStart}
                            onDragEnd={() => setDraggingCandidate(null)}
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
