/**
 * El backend calcula la puntuación media como `totalScore / interviews.length`, así que
 * llegan valores como 4.333333333333333. Pintarlos en crudo desborda la tarjeta, de modo
 * que se redondean a un decimal y se formatean con la convención local (4,3).
 */
const scoreFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export const formatScore = (score: number): string =>
    scoreFormatter.format(Number.isFinite(score) ? score : 0);
