/**
 * Servicios de API para la vista de detalle de una posición (kanban de candidatos).
 *
 * Nota sobre las rutas: el enunciado describe los endpoints como
 *   GET  /positions/:id/interviewFlow
 *   GET  /positions/:id/candidates
 *   PUT  /candidates/:id/stage
 * pero el backend de este repositorio (backend/src/index.ts y backend/src/routes)
 * los expone realmente en:
 *   GET  /position/:id/interviewflow
 *   GET  /position/:id/candidates
 *   PUT  /candidates/:id
 * Se usan las rutas reales para que la integración funcione contra el backend incluido.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3010';

export interface InterviewStep {
    id: number;
    interviewFlowId: number;
    interviewTypeId: number;
    name: string;
    orderIndex: number;
}

export interface InterviewFlow {
    id: number;
    description: string;
    interviewSteps: InterviewStep[];
}

export interface PositionInterviewFlow {
    positionName: string;
    interviewFlow: InterviewFlow;
}

export interface Candidate {
    /** Id del candidato (se usa en la URL del PUT) */
    id: number;
    /** Id de la aplicación del candidato a esta posición (va en el body del PUT) */
    applicationId: number;
    fullName: string;
    /** Nombre de la fase actual, tal y como lo devuelve el backend */
    currentInterviewStep: string;
    averageScore: number;
}

/** Candidato con la fase ya resuelta a id de columna, tal y como lo usa el tablero. */
export type BoardCandidate = Candidate & { stepId: number };

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, options);

    if (!response.ok) {
        let message = `Error ${response.status}`;
        try {
            const body = await response.json();
            message = body.message || body.error || message;
        } catch {
            // La respuesta no era JSON: nos quedamos con el mensaje genérico
        }
        throw new Error(message);
    }

    return response.json() as Promise<T>;
};

/**
 * Devuelve el nombre de la posición y las fases de su proceso de entrevistas.
 * El controller envuelve la respuesta del servicio en `{ interviewFlow }`, lo que
 * produce un doble anidado; se normaliza aquí para aislar al componente.
 */
export const getInterviewFlowByPosition = async (
    positionId: string | number
): Promise<PositionInterviewFlow> => {
    const data = await request<any>(`${API_BASE_URL}/position/${positionId}/interviewflow`);

    const payload = data?.interviewFlow?.interviewFlow ? data.interviewFlow : data;

    return {
        positionName: payload?.positionName ?? '',
        interviewFlow: {
            id: payload?.interviewFlow?.id,
            description: payload?.interviewFlow?.description ?? '',
            interviewSteps: payload?.interviewFlow?.interviewSteps ?? []
        }
    };
};

/** Devuelve todos los candidatos en proceso para una posición. */
export const getCandidatesByPosition = async (
    positionId: string | number
): Promise<Candidate[]> => {
    const data = await request<Candidate[]>(`${API_BASE_URL}/position/${positionId}/candidates`);
    return Array.isArray(data) ? data : [];
};

/** Mueve un candidato a otra fase del proceso. */
export const updateCandidateStage = async (
    candidateId: number,
    applicationId: number,
    interviewStepId: number
): Promise<any> =>
    request(`${API_BASE_URL}/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            applicationId: String(applicationId),
            currentInterviewStep: String(interviewStepId)
        })
    });
