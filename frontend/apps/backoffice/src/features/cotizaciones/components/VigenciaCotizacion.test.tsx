import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { VigenciaCotizacion } from './VigenciaCotizacion';

it('muestra el día de Argentina para el vencimiento UTC del contrato', () => {
  render(<VigenciaCotizacion fechaVencimiento="2026-11-12T02:30:00Z" vigente />);
  expect(screen.getByText('Válida hasta el 11/11/2026')).toBeInTheDocument();
});
