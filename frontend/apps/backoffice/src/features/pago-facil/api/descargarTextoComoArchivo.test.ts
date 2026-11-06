import { expect, it, vi } from 'vitest';
import { descargarTextoComoArchivo } from './descargarTextoComoArchivo';

it('revoca el object URL después de hacer clic y retira el enlace', () => {
  vi.useFakeTimers();
  const crear = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:https://api.test/base');
  const revocar = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  try {
    descargarTextoComoArchivo('base.txt', 'H1234520261120\r\n');
    expect(crear).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(click.mock.contexts[0]).not.toBeInTheDocument();
    expect(revocar).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(revocar).toHaveBeenCalledWith('blob:https://api.test/base');
  } finally {
    vi.useRealTimers();
    vi.restoreAllMocks();
  }
});
