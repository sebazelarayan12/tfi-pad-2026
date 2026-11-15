import { Beneficios } from '../components/Beneficios';
import { CoberturaPorVehiculo } from '../components/CoberturaPorVehiculo';
import { ComoPagar } from '../components/ComoPagar';
import { HeroPublico } from '../components/HeroPublico';
import { PreguntasFrecuentes } from '../components/PreguntasFrecuentes';
import { SeccionPlanes } from '../components/SeccionPlanes';

/** Home de la web pública (`/`, W1): hero, beneficios, vehículos, planes, cómo pagar y preguntas,
 * en secciones a todo el ancho que alternan blanco y niebla. No lee ni guarda datos. */
export function InicioPage() {
  return (
    <div className="flex flex-col">
      <HeroPublico />
      <Beneficios />
      <CoberturaPorVehiculo />
      <SeccionPlanes />
      <ComoPagar />
      <PreguntasFrecuentes />
    </div>
  );
}
