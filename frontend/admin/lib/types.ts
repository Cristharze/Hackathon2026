export type Estado = 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO'

export interface Recoleccion {
  id: string
  empresa_id: string | null
  empresa_nombre?: string
  estado: Estado
  fecha_recoleccion: string
  mensaje_raw: string | null
  imagen_url: string | null
  notas: string | null
  extraido_por_ia: boolean
  ia_confidence: number | null
  validado_at: string | null
  rechazado_motivo: string | null
  created_at: string
  // from vista_pendientes
  material?: string
  cantidad?: number
  unidad?: string
}

export interface Empresa {
  id: string
  nombre: string
  sector: string | null
  contacto: string | null
  email: string | null
  ciudad: string | null
  activa: boolean
}

export interface MetricaMensual {
  id: string
  empresa_id: string
  anio: number
  mes: number
  total_kg: number
  co2_ahorrado: number
  num_recolecciones: number
  desglose_materiales: Record<string, number> | null
}

export interface ImpactoRecoleccion {
  id: string
  recoleccion_id: string
  co2_ahorrado: number
  agua_ahorrada: number
  energia_ahorrada: number
  arboles_eq: number
}

export interface VistaPendiente extends Recoleccion {
  empresa_nombre: string
}

export interface VistaImpactoEmpresa {
  empresa_id: string
  empresa_nombre: string
  total_co2: number
  total_agua: number
  total_energia: number
  total_arboles: number
  num_recolecciones: number
}
