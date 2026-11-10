import { Beneficios } from '../components/Beneficios';
import { CoberturaPorVehiculo } from '../components/CoberturaPorVehiculo';
import { ComoPagar } from '../components/ComoPagar';
import { HeroPublico } from '../components/HeroPublico';
import { PreguntasFrecuentes } from '../components/PreguntasFrecuentes';
import { SeccionPlanes } from '../components/SeccionPlanes';

const DIVISOR = 'border-t border-border-hairline';

/** Home de la web pública (`/`, W1): hero, beneficios, vehículos, planes, cómo pagar y preguntas. No lee ni guarda datos. */
export function InicioPage() {
  return (
    <div className="flex flex-col">
      <HeroPublico />
      <Beneficios />
      <hr className={DIVISOR} />
      <CoberturaPorVehiculo />
      <hr className={DIVISOR} />
      <SeccionPlanes />
      <hr className={DIVISOR} />
      <ComoPagar />
      <hr className={DIVISOR} />
      <PreguntasFrecuentes />
    </div>
  );
}
