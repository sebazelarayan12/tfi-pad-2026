import { ComoPagar } from '../components/ComoPagar';
import { HeroPublico } from '../components/HeroPublico';
import { SeccionPlanes } from '../components/SeccionPlanes';

const DIVISOR = 'border-t border-border-hairline';

/** Home de la web pública (`/`, W1): hero, planes y cómo pagar. No lee ni guarda datos. */
export function InicioPage() {
  return (
    <div className="flex flex-col">
      <HeroPublico />
      <hr className={DIVISOR} />
      <SeccionPlanes />
      <hr className={DIVISOR} />
      <ComoPagar />
    </div>
  );
}
