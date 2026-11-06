import { useSaludo } from '../api/useSaludo';

export function SaludoInicio() {
  const nombre = useSaludo();
  return (
    <h1 className="break-words text-h1 text-text-primary">{nombre ? `Hola, ${nombre}` : 'Hola'}</h1>
  );
}
