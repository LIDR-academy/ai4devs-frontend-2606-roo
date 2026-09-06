import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PositionDetail from '../PositionDetail';
import * as positionService from '../../../services/positionService';

jest.mock('../../../services/positionService');
const mockedService = positionService as jest.Mocked<typeof positionService>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/positions/:id" element={<PositionDetail />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedService.getInterviewFlow.mockResolvedValue({
    positionName: 'Senior Backend Engineer',
    steps: [
      { id: 10, name: 'Llamada telefónica', orderIndex: 1 },
      { id: 20, name: 'Entrevista técnica', orderIndex: 2 },
    ],
  });
  mockedService.getCandidatesByPosition.mockResolvedValue([
    {
      id: 1,
      applicationId: 100,
      fullName: 'John Doe',
      currentInterviewStep: 'Llamada telefónica',
      averageScore: 3,
    },
  ]);
});

describe('PositionDetail', () => {
  it('muestra el título con el nombre de la posición', async () => {
    renderAt('/positions/1');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /Senior Backend Engineer Position/i }),
      ).toBeInTheDocument(),
    );
  });

  it('muestra un enlace de vuelta al listado de posiciones', async () => {
    renderAt('/positions/1');
    const back = await screen.findByRole('link', {
      name: /volver al listado de posiciones/i,
    });
    expect(back).toHaveAttribute('href', '/positions');
  });

  it('renderiza una columna por fase y coloca el candidato en su columna', async () => {
    renderAt('/positions/1');

    const phoneColumn = await screen.findByLabelText('Fase Llamada telefónica');
    const techColumn = screen.getByLabelText('Fase Entrevista técnica');

    expect(phoneColumn).toHaveTextContent('John Doe');
    expect(techColumn).not.toHaveTextContent('John Doe');
  });

  it('muestra un error si la carga falla', async () => {
    mockedService.getInterviewFlow.mockRejectedValue(new Error('boom'));
    mockedService.getCandidatesByPosition.mockRejectedValue(new Error('boom'));
    renderAt('/positions/1');

    await waitFor(() =>
      expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument(),
    );
  });
});
