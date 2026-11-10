import { AlertaError } from '@nexa/ui';

import { useRol } from '../../auth';
import { useMiCuenta } from '../api/useMiCuenta';
import { ClavePanel } from '../components/ClavePanel';
import { DocumentacionApi } from '../components/DocumentacionApi';

function PanelDeCuenta() {
  const cuenta = useMiCuenta(true);

  if (cuenta.isPending) {
    return <p className="text-body-sm text-text-secondary">Cargando tu cuenta…</p>;
  }
  if (cuenta.isError) {
    return <AlertaError>No pudimos cargar tu cuenta. Probá de nuevo en unos minutos.</AlertaError>;
  }
  return <ClavePanel cuenta={cuenta.data} />;
}

/**
 * Integraciones: para un grupo externo, el estado de su solicitud, su clave de API y la documentación
 * de los endpoints. Los empleados y administradores ven solo la documentación.
 */
export function IntegracionesPage() {
  const rol = useRol();

  return (
    <div className="flex max-w-[960px] flex-col gap-sp-32">
      {rol === 'Grupo' ? <PanelDeCuenta /> : null}
      <DocumentacionApi />
    </div>
  );
}
