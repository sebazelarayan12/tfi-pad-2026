import { CardWidget } from '@nexa/ui';

const validaciones = [
  'Cliente validado en Renaper',
  'Vehículo validado en DNRPA',
  'Sin otra póliza activa para el vehículo',
  'Plan compatible con el vehículo',
];

export function ValidacionesPanel() {
  return (
    <CardWidget title="Validaciones">
      <ul className="list-disc space-y-sp-8 pl-sp-16">
        {validaciones.map((texto) => (
          <li key={texto}>{texto}</li>
        ))}
      </ul>
    </CardWidget>
  );
}
