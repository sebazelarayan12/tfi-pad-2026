interface PolizaVehiculoCeldaProps {
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
}

/** Marca, modelo y año arriba; patente en mono debajo (B9). */
export function PolizaVehiculoCelda({ marca, modelo, anio, patente }: PolizaVehiculoCeldaProps) {
  return (
    <div className="flex flex-col">
      <span>{`${marca} ${modelo} ${anio}`}</span>
      <span className="font-mono text-mono">{patente}</span>
    </div>
  );
}
