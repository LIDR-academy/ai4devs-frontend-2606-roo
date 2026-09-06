import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCandidatesByPosition,
  getInterviewFlow,
  updateCandidateStage,
} from '../../services/positionService';
import { CandidateCard, InterviewStep } from '../../types/position';

interface KanbanState {
  positionName: string;
  steps: InterviewStep[];
  candidates: CandidateCard[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: KanbanState = {
  positionName: '',
  steps: [],
  candidates: [],
  loading: true,
  error: null,
};

/**
 * Encapsula la carga de datos y la lógica de negocio del kanban de una posición:
 * - carga en paralelo flujo de entrevistas y candidatos
 * - agrupa candidatos por fase
 * - mueve un candidato de fase con actualización optimista y rollback
 */
export const usePositionKanban = (positionId: number) => {
  const [state, setState] = useState<KanbanState>(INITIAL_STATE);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [flow, candidates] = await Promise.all([
        getInterviewFlow(positionId),
        getCandidatesByPosition(positionId),
      ]);
      setState({
        positionName: flow.positionName,
        steps: flow.steps,
        candidates,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'No se pudieron cargar los datos de la posición.',
      }));
    }
  }, [positionId]);

  useEffect(() => {
    if (Number.isNaN(positionId)) {
      setState((s) => ({ ...s, loading: false, error: 'Posición no válida.' }));
      return;
    }
    void load();
  }, [positionId, load]);

  /** Mapa nombre de fase -> id de fase (el backend devuelve la fase por nombre). */
  const stepIdByName = useMemo(() => {
    const map = new Map<string, number>();
    state.steps.forEach((step) => map.set(step.name, step.id));
    return map;
  }, [state.steps]);

  /** Candidatos agrupados por id de fase. */
  const candidatesByStepId = useMemo(() => {
    const grouped = new Map<number, CandidateCard[]>();
    state.steps.forEach((step) => grouped.set(step.id, []));
    state.candidates.forEach((candidate) => {
      const stepId = stepIdByName.get(candidate.currentInterviewStep);
      if (stepId !== undefined) {
        grouped.get(stepId)!.push(candidate);
      }
    });
    return grouped;
  }, [state.candidates, state.steps, stepIdByName]);

  /**
   * Mueve un candidato a otra fase.
   * Actualiza el estado local de inmediato y revierte si la API falla.
   */
  const moveCandidate = useCallback(
    async (candidateId: number, applicationId: number, destStepId: number) => {
      const destStep = state.steps.find((s) => s.id === destStepId);
      const candidate = state.candidates.find((c) => c.id === candidateId);
      if (!destStep || !candidate) return;
      if (candidate.currentInterviewStep === destStep.name) return;

      const previous = state.candidates;
      setState((s) => ({
        ...s,
        candidates: s.candidates.map((c) =>
          c.id === candidateId
            ? { ...c, currentInterviewStep: destStep.name }
            : c,
        ),
      }));

      try {
        await updateCandidateStage(candidateId, applicationId, destStepId);
      } catch (e) {
        setState((s) => ({
          ...s,
          candidates: previous,
          error: 'No se pudo actualizar la fase del candidato.',
        }));
      }
    },
    [state.candidates, state.steps],
  );

  const clearError = useCallback(
    () => setState((s) => ({ ...s, error: null })),
    [],
  );

  return {
    positionName: state.positionName,
    steps: state.steps,
    candidatesByStepId,
    loading: state.loading,
    error: state.error,
    moveCandidate,
    reload: load,
    clearError,
  };
};
