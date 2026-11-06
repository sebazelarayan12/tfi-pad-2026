import { TEXTO_NO_DISPONIBLE } from '../textos';

interface PolizaVehiculoCeldaProps {
  patente: string;
}

/** La lista no trae marca, modelo ni año (D6 de B9): arriba "No disponible", abajo la patente. */
export function PolizaVehiculoCelda({ patente }: PolizaVehiculoCeldaProps) {
  return (
    <div className="flex flex-col">
      <span className="text-text-secondary">{TEXTO_NO_DISPONIBLE}</span>
      <span className="font-mono text-mono">{patente}</span>
    </div>
  );
}
