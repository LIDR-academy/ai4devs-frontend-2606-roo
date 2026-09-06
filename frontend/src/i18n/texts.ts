/**
 * Textos de la interfaz, separados de la estructura.
 *
 * No se añade una librería de i18n (next-intl, react-i18next…) porque el proyecto
 * tiene un único idioma y hacerlo ahora sería sobre-construir. Extraer las cadenas
 * a un módulo tipado deja el terreno preparado: migrar a i18next consiste en
 * sustituir este objeto por su catálogo, sin tocar los componentes.
 */
export const texts = {
    positionDetail: {
        fallbackTitle: 'Posición',
        backToList: 'Volver al listado de posiciones',
        loading: 'Cargando…',
        retry: 'Reintentar',
        genericLoadError: 'Error cargando la posición',
        missingPositionId: 'No se ha indicado ninguna posición',
        board: 'Fases del proceso de contratación',
        dragHint:
            'Arrastra una tarjeta a otra columna para cambiar de fase, o usa el menú de cada candidato.'
    },
    stageColumn: {
        label: (stepName: string) => `Fase ${stepName}`,
        candidateCount: (count: number) =>
            count === 1 ? '1 candidato' : `${count} candidatos`,
        empty: 'Sin candidatos'
    },
    candidateCard: {
        moveMenuHeader: 'Mover a',
        moveMenuLabel: (fullName: string) => `Mover a ${fullName} de fase`,
        summary: (fullName: string, score: number, stepName: string) =>
            `${fullName}, puntuación media ${score} sobre 5, fase ${stepName}`,
        scoreLabel: (score: number) => `Puntuación media: ${score} sobre 5`
    },
    status: {
        moved: (fullName: string, stepName: string) => `${fullName} movido a ${stepName}`,
        moveFailed: (fullName: string, reason: string) =>
            `No se pudo mover a ${fullName}: ${reason}`,
        unknownError: 'error desconocido'
    }
} as const;
