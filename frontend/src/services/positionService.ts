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
 *
 * Nota sobre seguridad: la respuesta del backend se valida en tiempo de ejecución antes
 * de entrar en el estado de React. No se usa Zod/Valibot para no añadir una dependencia
 * a un contrato tan pequeño, pero el principio es el mismo: no confiar en la forma de
 * los datos que llegan por la red. Aquí no se maneja ningún secreto: REACT_APP_API_URL
 * acaba en el bundle y solo contiene la URL pública del backend.
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const toNumber = (value: unknown, fallback = 0): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toText = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback;

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, options);

    if (!response.ok) {
        let message = `Error ${response.status}`;
        try {
            const body: unknown = await response.json();
            if (isRecord(body)) {
                message = toText(body.message, toText(body.error, message));
            }
        } catch {
            // La respuesta no era JSON: nos quedamos con el mensaje genérico
        }
        throw new Error(message);
    }

    return (await response.json()) as T;
};

/** Descarta las fases sin los campos mínimos (id y nombre) en lugar de propagar basura al estado. */
const parseInterviewStep = (raw: unknown): InterviewStep | null => {
    if (!isRecord(raw) || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
        return null;
    }

    return {
        id: raw.id,
        interviewFlowId: toNumber(raw.interviewFlowId),
        interviewTypeId: toNumber(raw.interviewTypeId),
        name: raw.name,
        orderIndex: toNumber(raw.orderIndex)
    };
};

/** Descarta los candidatos sin los identificadores necesarios para poder actualizarlos después. */
const parseCandidate = (raw: unknown): Candidate | null => {
    if (!isRecord(raw) || typeof raw.id !== 'number' || typeof raw.applicationId !== 'number') {
        return null;
    }

    return {
        id: raw.id,
        applicationId: raw.applicationId,
        fullName: toText(raw.fullName),
        currentInterviewStep: toText(raw.currentInterviewStep),
        averageScore: toNumber(raw.averageScore)
    };
};

const isNotNull = <T>(value: T | null): value is T => value !== null;

/**
 * El controller envuelve la respuesta del servicio en `{ interviewFlow }`, lo que produce
 * un doble anidado. Se acepta tanto esa forma como la plana del enunciado, por si el
 * backend se corrige más adelante.
 */
const unwrapInterviewFlow = (data: unknown): Record<string, unknown> => {
    if (!isRecord(data)) return {};

    const inner = data.interviewFlow;
    return isRecord(inner) && 'positionName' in inner ? inner : data;
};

/** Devuelve el nombre de la posición y las fases de su proceso de entrevistas. */
export const getInterviewFlowByPosition = async (
    positionId: string | number
): Promise<PositionInterviewFlow> => {
    const data = await request<unknown>(
        `${API_BASE_URL}/position/${encodeURIComponent(positionId)}/interviewflow`
    );

    const payload = unwrapInterviewFlow(data);
    const flow = isRecord(payload.interviewFlow) ? payload.interviewFlow : {};
    const rawSteps = Array.isArray(flow.interviewSteps) ? flow.interviewSteps : [];

    return {
        positionName: toText(payload.positionName),
        interviewFlow: {
            id: toNumber(flow.id),
            description: toText(flow.description),
            interviewSteps: rawSteps.map(parseInterviewStep).filter(isNotNull)
        }
    };
};

/** Devuelve todos los candidatos en proceso para una posición. */
export const getCandidatesByPosition = async (
    positionId: string | number
): Promise<Candidate[]> => {
    const data = await request<unknown>(
        `${API_BASE_URL}/position/${encodeURIComponent(positionId)}/candidates`
    );

    return Array.isArray(data) ? data.map(parseCandidate).filter(isNotNull) : [];
};

/** Mueve un candidato a otra fase del proceso. */
export const updateCandidateStage = async (
    candidateId: number,
    applicationId: number,
    interviewStepId: number
): Promise<void> => {
    await request<unknown>(`${API_BASE_URL}/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            applicationId: String(applicationId),
            currentInterviewStep: String(interviewStepId)
        })
    });
};
