// Capa de acceso a la API para la vista de detalle de posición (kanban).
// Centraliza las llamadas HTTP para no repetir `fetch`/`axios` en los componentes (DRY).

import axios from 'axios';
import { CandidateCard, InterviewFlowResponse, InterviewStep } from '../types/position';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010';

const client = axios.create({ baseURL: API_URL });

/**
 * Obtiene el flujo de entrevistas de una posición.
 * Devuelve el nombre de la posición y los pasos ordenados por `orderIndex`.
 */
export const getInterviewFlow = async (
  positionId: number,
): Promise<{ positionName: string; steps: InterviewStep[] }> => {
  const { data } = await client.get<InterviewFlowResponse>(
    `/position/${positionId}/interviewflow`,
  );
  const flow = data.interviewFlow;
  const steps = [...flow.interviewFlow.interviewSteps].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  return { positionName: flow.positionName, steps };
};

/** Obtiene los candidatos de una posición con su fase y puntuación media. */
export const getCandidatesByPosition = async (
  positionId: number,
): Promise<CandidateCard[]> => {
  const { data } = await client.get<CandidateCard[]>(
    `/position/${positionId}/candidates`,
  );
  return data;
};

/**
 * Actualiza la fase (paso de entrevista) en la que se encuentra un candidato.
 * El backend espera el id numérico del paso destino.
 */
export const updateCandidateStage = async (
  candidateId: number,
  applicationId: number,
  newStepId: number,
): Promise<void> => {
  await client.put(`/candidates/${candidateId}`, {
    applicationId,
    currentInterviewStep: newStepId,
  });
};
