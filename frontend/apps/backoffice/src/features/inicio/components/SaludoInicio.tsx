import { formatearFechaCalendario, TEXTO_SIN_DATO } from '@nexa/api';
import { useResumenInicio } from '../api/useResumenInicio';
import { useSaludo } from '../api/useSaludo';

export function SaludoInicio({ vencidas, pendientes }: { vencidas?: number; pendientes?: number }) {
  const nombre = useSaludo();
  const resumen = useResumenInicio();
  const fecha = formatearFechaCalendario(resumen.data);
  const mostrar =
    resumen.isSuccess &&
    fecha !== TEXTO_SIN_DATO &&
    vencidas !== undefined &&
    pendientes !== undefined;
  return (
    <div className="flex flex-col gap-sp-4">
      <h1 className="break-words text-h1 text-text-primary">
        {nombre ? `Hola, ${nombre}` : 'Hola'}
      </h1>
      {mostrar ? (
        <p className="text-body text-text-secondary">
          Hay {vencidas} cuotas vencidas y {pendientes} pólizas pendientes de pago al {fecha}.
        </p>
      ) : null}
    </div>
  );
}
