import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { formatoFactor, formatoLinea } from './formatoCalculo';
import { LineaCalculo } from './LineaCalculo';
import { PlanOpcionCard } from './PlanOpcionCard';

const calculo = {
  primaBase: 10000,
  factorTipo: 1,
  factorAntiguedad: 1.1,
  factorEdad: 1,
  factorUso: 1,
};
const formula = '10.000,00 x 1,00 x 1,10 x 1,00 x 1,00';

it('formatea la prima base y los cuatro factores en el orden de RN06', () => {
  expect(formatoFactor(1.1)).toBe('1,10');
  expect(formatoLinea(calculo)).toBe(formula);
  render(<LineaCalculo calculo={calculo} />);
  expect(screen.getByText(formula)).toHaveClass('font-mono');
});

it('no renderiza un nodo cuando falta el cálculo', () => {
  const { container } = render(<LineaCalculo />);
  expect(container).toBeEmptyDOMElement();
});

it('conserva la prima de la opción aunque el producto de los factores sea distinto', () => {
  render(
    <PlanOpcionCard
      opcion={{
        idCotizacion: 'id-tc',
        codigoPlan: 'TC',
        plan: 'Terceros Completo',
        primaMensual: 19800,
        calculo,
      }}
      elegida={false}
      onElegir={() => {}}
    />,
  );
  expect(screen.getByText(formula)).toBeInTheDocument();
  expect(
    screen.getByRole('radio', { name: /TC Terceros Completo, prima mensual \$\s19\.800,00/ }),
  ).toBeInTheDocument();
});
