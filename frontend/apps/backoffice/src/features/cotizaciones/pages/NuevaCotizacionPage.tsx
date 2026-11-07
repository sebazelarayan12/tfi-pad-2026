import { ApiError, formatearDni, leerMensajeDetalle, parsearFechaUtc } from '@nexa/api';
import { AlertaError } from '@nexa/ui';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useRol } from '../../auth';
import { useClienteContexto } from '../api/useClienteContexto';
import { useCotizar } from '../api/useCotizar';
import { usePlanesCatalogo } from '../api/usePlanesCatalogo';
import { useVehiculoContexto } from '../api/useVehiculoContexto';
import { BotonCotizar, ContinuarAEmision } from '../components/AccionesCotizacion';
import { DatosCotizacionWidget } from '../components/DatosCotizacionWidget';
import { PlanesCompatibles } from '../components/PlanesCompatibles';
import { VigenciaCotizacion } from '../components/VigenciaCotizacion';
import { estaVigente, useCotizacionVigente } from '../hooks/useCotizacionVigente';
import { parametrosCotizacion } from '../schemas/parametrosCotizacion';

function mensajeConsulta(error: unknown, fallback: string) {
  return error instanceof ApiError && error.detail?.trim()
    ? leerMensajeDetalle(error).mensaje
    : fallback;
}

function CotizacionDelVehiculo({ vehiculoId }: { vehiculoId: string }) {
  const navegar = useNavigate();
  const vehiculo = useVehiculoContexto(vehiculoId);
  // El titular del vehículo determina el contexto, incluso si la URL trae otro cliente.
  const cliente = useClienteContexto(vehiculo.data?.clienteId);
  const catalogo = usePlanesCatalogo();
  const { resultado, cotizando, cotizar } = useCotizar();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const limite = parsearFechaUtc(resultado?.fechaVencimiento)?.getTime();
  const vigente = useCotizacionVigente(limite);
  const elegida = resultado?.opciones.find((opcion) => opcion.idCotizacion === seleccion);

  return (
    <div className="flex min-w-0 flex-col gap-sp-24 xl:flex-row">
      <section
        aria-label="Cotización del vehículo"
        className="flex min-w-0 flex-1 flex-col gap-sp-24"
      >
        <div className="flex flex-wrap items-start justify-between gap-sp-16">
          <div className="flex min-w-0 flex-col gap-sp-8">
            {vehiculo.isError ? (
              <AlertaError>
                {mensajeConsulta(vehiculo.error, 'No se pudo cargar el vehículo.')}
              </AlertaError>
            ) : vehiculo.data ? (
              <>
                {cliente.data ? (
                  <p className="text-body-sm text-text-secondary">
                    Cliente:{' '}
                    <strong className="text-text-primary">
                      {cliente.data.nombre} {cliente.data.apellido}
                    </strong>
                    {' · DNI '}
                    {formatearDni(cliente.data.dni)}
                  </p>
                ) : cliente.isError ? (
                  <AlertaError>
                    {mensajeConsulta(cliente.error, 'No se pudo cargar el cliente.')}
                  </AlertaError>
                ) : (
                  <p role="status" className="text-body-sm text-text-secondary">
                    Cargando cliente…
                  </p>
                )}
                <p className="text-body-sm text-text-secondary">
                  Vehículo:{' '}
                  <strong className="text-text-primary">
                    {vehiculo.data.marca} {vehiculo.data.modelo} {vehiculo.data.anio}
                  </strong>
                  <span className="block font-mono">{vehiculo.data.patente}</span>
                </p>
              </>
            ) : (
              <div role="status">
                <span className="sr-only">Cargando vehículo…</span>
                <div
                  aria-hidden="true"
                  className="h-4 w-56 max-w-full rounded-input bg-surface-subtle motion-safe:animate-pulse"
                />
              </div>
            )}
          </div>
          <BotonCotizar
            habilitado={vehiculo.isSuccess}
            cotizando={cotizando}
            onCotizar={() => {
              setSeleccion(null);
              cotizar(vehiculoId);
            }}
          />
        </div>
        {resultado ? (
          <>
            <PlanesCompatibles
              opciones={resultado.opciones}
              catalogo={catalogo.data ?? []}
              seleccion={seleccion}
              onElegir={setSeleccion}
            />
            {resultado.opciones.length ? (
              <VigenciaCotizacion fechaVencimiento={resultado.fechaVencimiento} vigente={vigente} />
            ) : null}
          </>
        ) : null}
        <ContinuarAEmision
          habilitado={Boolean(elegida && vigente)}
          onContinuar={() => {
            if (!elegida || !estaVigente(limite)) return;
            const query = new URLSearchParams({ cotizacionId: elegida.idCotizacion });
            navegar('/polizas/nueva?' + query.toString());
          }}
        />
      </section>
      <aside
        data-slot="rail"
        aria-label="Datos de la cotización"
        className="w-full xl:w-[300px] xl:shrink-0"
      >
        <DatosCotizacionWidget
          cliente={cliente.data}
          vehiculo={vehiculo.data}
          opciones={resultado?.opciones}
          elegida={elegida}
        />
      </aside>
    </div>
  );
}

export function NuevaCotizacionPage() {
  const rol = useRol();
  const [query] = useSearchParams();
  if (rol !== 'Empleado' && rol !== 'Administrador') {
    return <p className="text-text-primary">No tenés permiso para esta acción.</p>;
  }
  const parametros = parametrosCotizacion.safeParse({
    vehiculoId: query.get('vehiculoId'),
    clienteId: query.get('clienteId') ?? undefined,
  });
  if (!parametros.success) return <Navigate to="/clientes" replace />;
  const { vehiculoId } = parametros.data;
  return <CotizacionDelVehiculo key={vehiculoId} vehiculoId={vehiculoId} />;
}
