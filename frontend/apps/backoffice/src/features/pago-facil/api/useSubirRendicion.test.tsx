import { pagoFacilKeys } from '@nexa/api';
import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { proveedoresRendicion } from '../test/proveedoresRendicion';
import { useSubirRendicion } from './useSubirRendicion';

it('invalida el historial tras un 201', async () => {
  const { wrapper, queryClient } = proveedoresRendicion();
  const invalidar = vi.spyOn(queryClient, 'invalidateQueries');
  const { result } = renderHook(useSubirRendicion, { wrapper });
  await act(async () => {
    await result.current.mutateAsync(new File(['123'], 'rendicion.txt'));
  });
  expect(invalidar).toHaveBeenCalledWith({ queryKey: pagoFacilKeys.rendiciones() });
});
