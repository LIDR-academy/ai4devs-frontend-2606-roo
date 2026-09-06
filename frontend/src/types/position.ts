// Tipos del dominio de posiciones e interfaz kanban de candidatos.

/** Paso del flujo de entrevistas (columna del kanban). */
export interface InterviewStep {
  id: number;
  name: string;
  orderIndex: number;
}

/**
 * Respuesta de GET /position/:id/interviewflow
 * El controlador envuelve el resultado del servicio en `{ interviewFlow: ... }`,
 * y el servicio a su vez anida otro `interviewFlow`, de ahí el doble nivel.
 */
export interface InterviewFlowResponse {
  interviewFlow: {
    positionName: string;
    interviewFlow: {
      id: number;
      description: string | null;
      interviewSteps: InterviewStep[];
    };
  };
}

/**
 * Candidato de una posición (tarjeta del kanban).
 * Respuesta de GET /position/:id/candidates
 *
 * Nota: el backend devuelve `currentInterviewStep` como el NOMBRE del paso,
 * no su id. El id se resuelve en el cliente a partir del flujo de entrevistas.
 */
export interface CandidateCard {
  id: number;
  applicationId: number;
  fullName: string;
  currentInterviewStep: string;
  averageScore: number;
}
