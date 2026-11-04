// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('setup de Vitest', () => {
  it('setup expone matchers jest-dom', () => {
    render(<button type="button">Aceptar</button>);
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
  });

  it('setup hace cleanup', () => {
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
    expect(document.body.innerHTML).toBe('');
  });
});
