import React from 'react';

interface ScoreIndicatorProps {
  /** Puntuación media del candidato (0-5). */
  score: number;
  /** Número máximo de puntos a mostrar. */
  max?: number;
}

/**
 * Muestra la puntuación media de un candidato como una fila de puntos.
 * Los puntos rellenos representan la puntuación redondeada.
 */
const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ score, max = 5 }) => {
  const filled = Math.min(max, Math.max(0, Math.round(score)));

  return (
    <div
      className="score-indicator"
      role="img"
      aria-label={`Puntuación media ${score.toFixed(1)} de ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`score-dot ${i < filled ? 'score-dot--filled' : ''}`}
        />
      ))}
    </div>
  );
};

export default ScoreIndicator;
