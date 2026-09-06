import { useCallback, useEffect, useState } from 'react';
import {
    BoardCandidate,
    Candidate,
    InterviewStep,
    getCandidatesByPosition,
    getInterviewFlowByPosition,
    updateCandidateStage
} from '../services/positionService';
import { texts } from '../i18n/texts';

const sortSteps = (steps: InterviewStep[]): InterviewStep[] =>
    [...steps].sort((a, b) => a.orderIndex - b.orderIndex);

/**
 * El endpoint de candidatos devuelve la fase por nombre, mientras que las columnas y el
 * PUT trabajan con el id de la fase. Aquí se resuelve el nombre a id; si no hay
 * coincidencia, el candidato cae en la primera fase del proceso en lugar de desaparecer
 * del tablero.
 */
const toBoardCandidates = (candidates: Candidate[], steps: InterviewStep[]): BoardCandidate[] => {
    const stepIdByName = new Map(steps.map(step => [step.name, step.id]));
    const fallbackStepId = steps[0]?.id ?? 0;

    return candidates.map(candidate => ({
        ...candidate,
        stepId: stepIdByName.get(candidate.currentInterviewStep) ?? fallbackStepId
    }));
};

const describeError = (error: unknown): string =>
    error instanceof Error ? error.message : texts.status.unknownError;

export interface PositionBoard {
    positionName: string;
    steps: InterviewStep[];
    candidates: BoardCandidate[];
    loading: boolean;
    loadError: string | null;
    /** Último resultado de un movimiento, para anunciarlo en una región aria-live */
    statusMessage: string | null;
    moveError: string | null;
    reload: () => void;
    moveCandidate: (candidate: BoardCandidate, targetStepId: number) => void;
    dismissMoveError: () => void;
}

/**
 * Carga y gestiona el tablero de candidatos de una posición.
 *
 * Se extrae de la vista para que el componente quede solo con la presentación y para
 * poder testear la lógica de fases y de movimiento por separado.
 */
export const usePositionBoard = (positionId?: string): PositionBoard => {
    const [positionName, setPositionName] = useState('');
    const [steps, setSteps] = useState<InterviewStep[]>([]);
    const [candidates, setCandidates] = useState<BoardCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [moveError, setMoveError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!positionId) {
            setLoading(false);
            setLoadError(texts.positionDetail.missingPositionId);
            return;
        }

        // Evita escribir estado si el usuario navega fuera antes de que respondan las peticiones
        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        Promise.all([getInterviewFlowByPosition(positionId), getCandidatesByPosition(positionId)])
            .then(([flow, candidateList]) => {
                if (cancelled) return;
                const orderedSteps = sortSteps(flow.interviewFlow.interviewSteps);
                setPositionName(flow.positionName);
                setSteps(orderedSteps);
                setCandidates(toBoardCandidates(candidateList, orderedSteps));
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setLoadError(describeError(error) || texts.positionDetail.genericLoadError);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [positionId, reloadToken]);

    const reload = useCallback(() => setReloadToken(token => token + 1), []);

    const setCandidateStep = useCallback((applicationId: number, stepId: number) => {
        setCandidates(current =>
            current.map(item => (item.applicationId === applicationId ? { ...item, stepId } : item))
        );
    }, []);

    /** Mueve la tarjeta de forma optimista y la devuelve a su columna si el backend falla. */
    const moveCandidate = useCallback(
        (candidate: BoardCandidate, targetStepId: number) => {
            const originStepId = candidate.stepId;
            if (originStepId === targetStepId) return;

            const targetStep = steps.find(step => step.id === targetStepId);
            if (!targetStep) return;

            setMoveError(null);
            setStatusMessage(null);
            setCandidateStep(candidate.applicationId, targetStepId);

            updateCandidateStage(candidate.id, candidate.applicationId, targetStepId)
                .then(() => {
                    setStatusMessage(texts.status.moved(candidate.fullName, targetStep.name));
                })
                .catch((error: unknown) => {
                    setCandidateStep(candidate.applicationId, originStepId);
                    setMoveError(texts.status.moveFailed(candidate.fullName, describeError(error)));
                });
        },
        [setCandidateStep, steps]
    );

    const dismissMoveError = useCallback(() => setMoveError(null), []);

    return {
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
    };
};
