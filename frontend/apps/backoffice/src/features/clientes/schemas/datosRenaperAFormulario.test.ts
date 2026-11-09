import type { PersonaRenaperResponse } from '@nexa/api';
import { describe, expect, it } from 'vitest';

import { datosRenaperAFormulario } from './datosRenaperAFormulario';

const personaCompleta: PersonaRenaperResponse = {
  dni: '30123456',
  cuil: '20301234565',
  nombre: 'Juan Carlos',
  apellido: 'Pérez',
  fechaNacimiento: '1985-03-21',
  sexo: 'M',
  domicilio: {
    calle: 'San Martín',
    numero: '1234',
    piso: null,
    depto: null,
    localidad: 'San Miguel de Tucumán',
    provincia: 'Tucumán',
    codigoPostal: '4000',
  },
  estado: 'VIGENTE',
  fechaFallecimiento: null,
};

// Lo que publica OpenRENAPER: un solo texto de nombre, CUIT y sexo; sin domicilio ni fecha.
const personaAbierta: PersonaRenaperResponse = {
  dni: '30123456',
  cuil: '20301234565',
  nombre: 'PEREZ JUAN CARLOS',
  apellido: null,
  fechaNacimiento: null,
  sexo: 'M',
  domicilio: null,
  estado: 'VIGENTE',
  fechaFallecimiento: null,
};

describe('datosRenaperAFormulario', () => {
  it('con una persona completa precarga todos los campos con el formato del formulario', () => {
    expect(datosRenaperAFormulario(personaCompleta)).toEqual({
      sexo: 'M',
      nombre: 'Juan Carlos',
      apellido: 'Pérez',
      cuil: '20-30123456-5',
      fechaNacimiento: '21/03/1985',
      calle: 'San Martín',
      numero: '1234',
      localidad: 'San Miguel de Tucumán',
      provincia: 'Tucumán',
      codigoPostal: '4000',
    });
  });

  it('una provincia fuera de la lista queda vacía', () => {
    const datos = datosRenaperAFormulario({
      ...personaCompleta,
      domicilio: { ...personaCompleta.domicilio!, provincia: 'Provincia inexistente' },
    });

    expect(datos.provincia).toBe('');
  });

  it('con lo que publica OpenRENAPER solo precarga CUIL y sexo y deja lo demás como lo cargó el empleado', () => {
    expect(datosRenaperAFormulario(personaAbierta)).toEqual({
      sexo: 'M',
      cuil: '20-30123456-5',
    });
  });

  it('sin apellido no precarga el nombre: viene junto con el apellido en un solo texto', () => {
    const datos = datosRenaperAFormulario(personaAbierta);

    expect(datos).not.toHaveProperty('nombre');
    expect(datos).not.toHaveProperty('apellido');
  });

  it('sin ningún dato opcional devuelve un objeto vacío', () => {
    expect(datosRenaperAFormulario({ ...personaAbierta, cuil: null, sexo: null })).toEqual({});
  });
});
