import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { InterruptorTema } from './InterruptorTema';

afterEach(() => {
  document.documentElement.removeAttribute('data-tema');
  localStorage.clear();
});

describe('InterruptorTema', () => {
  it('alterna entre claro y oscuro y recuerda la elección', async () => {
    render(<InterruptorTema />);
    const interruptor = screen.getByRole('switch', { name: 'Modo oscuro' });
    expect(interruptor).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(interruptor);
    expect(interruptor).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveAttribute('data-tema', 'oscuro');
    expect(localStorage.getItem('nexa-tema')).toBe('oscuro');

    await userEvent.click(interruptor);
    expect(document.documentElement).toHaveAttribute('data-tema', 'claro');
  });
});
