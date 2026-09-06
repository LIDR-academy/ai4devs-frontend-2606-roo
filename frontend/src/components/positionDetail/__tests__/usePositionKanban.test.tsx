import { renderHook, act, waitFor } from '@testing-library/react';
import { usePositionKanban } from '../usePositionKanban';
import * as positionService from '../../../services/positionService';

jest.mock('../../../services/positionService');

const mockedService = positionService as jest.Mocked<typeof positionService>;

const steps = [
  { id: 10, name: 'Llamada telefónica', orderIndex: 1 },
  { id: 20, name: 'Entrevista técnica', orderIndex: 2 },
];

const candidates = [
  {
    id: 1,
    applicationId: 100,
    fullName: 'John Doe',
    currentInterviewStep: 'Llamada telefónica',
    averageScore: 3,
  },
  {
    id: 2,
    applicationId: 200,
    fullName: 'Jane Smith',
    currentInterviewStep: 'Entrevista técnica',
    averageScore: 4,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedService.getInterviewFlow.mockResolvedValue({
    positionName: 'Senior Backend Engineer',
    steps,
  });
  mockedService.getCandidatesByPosition.mockResolvedValue(candidates);
});

describe('usePositionKanban', () => {
  it('carga y agrupa los candidatos por fase', async () => {
    const { result } = renderHook(() => usePositionKanban(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.positionName).toBe('Senior Backend Engineer');
    expect(result.current.candidatesByStepId.get(10)).toHaveLength(1);
    expect(result.current.candidatesByStepId.get(20)).toHaveLength(1);
    expect(result.current.candidatesByStepId.get(10)![0].fullName).toBe('John Doe');
  });

  it('mueve un candidato de fase llamando a la API con el id del paso destino', async () => {
    mockedService.updateCandidateStage.mockResolvedValue();
    const { result } = renderHook(() => usePositionKanban(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveCandidate(1, 100, 20);
    });

    expect(mockedService.updateCandidateStage).toHaveBeenCalledWith(1, 100, 20);
    expect(result.current.candidatesByStepId.get(10)).toHaveLength(0);
    expect(result.current.candidatesByStepId.get(20)).toHaveLength(2);
  });

  it('revierte el movimiento si la API falla', async () => {
    mockedService.updateCandidateStage.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => usePositionKanban(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveCandidate(1, 100, 20);
    });

    expect(result.current.candidatesByStepId.get(10)).toHaveLength(1);
    expect(result.current.candidatesByStepId.get(20)).toHaveLength(1);
    expect(result.current.error).toBeTruthy();
  });

  it('marca error si la posición no es válida', async () => {
    const { result } = renderHook(() => usePositionKanban(NaN));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
