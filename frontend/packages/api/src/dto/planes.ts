export interface PlanRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
  primaBase: number;
  /** Nombres de TipoVehiculo separados por coma. */
  tiposPermitidos: string;
  antiguedadMaxima?: number | null;
}

export interface PlanResponse extends PlanRequest {
  id: string;
  antiguedadMaxima: number | null;
  activo: boolean;
}

export type PlanListResponse = PlanResponse[];

/** MOCK (PB-09). */
export interface ActivoPlanRequest {
  activo: boolean;
}
