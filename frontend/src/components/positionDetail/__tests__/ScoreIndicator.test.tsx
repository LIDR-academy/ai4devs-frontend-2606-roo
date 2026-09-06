import React from 'react';
import { render } from '@testing-library/react';
import ScoreIndicator from '../ScoreIndicator';

const countFilled = (container: HTMLElement) =>
  container.querySelectorAll('.score-dot--filled').length;

describe('ScoreIndicator', () => {
  it('no rellena ningún punto con puntuación 0', () => {
    const { container } = render(<ScoreIndicator score={0} />);
    expect(countFilled(container)).toBe(0);
    expect(container.querySelectorAll('.score-dot')).toHaveLength(5);
  });

  it('rellena los puntos según la puntuación redondeada', () => {
    const { container } = render(<ScoreIndicator score={3} />);
    expect(countFilled(container)).toBe(3);
  });

  it('redondea al entero más cercano', () => {
    const { container } = render(<ScoreIndicator score={4.6} />);
    expect(countFilled(container)).toBe(5);
  });

  it('nunca supera el máximo', () => {
    const { container } = render(<ScoreIndicator score={9} max={5} />);
    expect(countFilled(container)).toBe(5);
  });
});
