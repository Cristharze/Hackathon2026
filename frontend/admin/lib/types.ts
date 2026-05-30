export type Estado = 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO'

export interface VistaPendiente {
  id: string
  empresa_id?: string
  empresa: string           // nombre de empresa desde la vista
  empresa_sector?: string
  estado?: Estado
  fecha_recoleccion: string
  mensaje_raw: string | null
  imagen_url: string | null
  notas?: string | null
  extraido_por_ia?: boolean
  ia_confidence: number | null
  validado_at?: string | null
  rechazado_motivo?: string | null
  num_materiales?: number
  total_kg?: number
  created_at?: string
}

export interface Empresa {
  id: string
  nombre: string
  sector: string | null
  contacto: string | null
  email: string | null
  ciudad: string | null
  activa: boolean
  ruc?: string | null
  telefono?: string | null
  fecha_ingreso?: string | null
}

export interface Recoleccion {
  id: string
  empresa_id: string | null
  estado: Estado
  fecha_recoleccion: string
  mensaje_raw: string | null
  imagen_url?: string | null
  notas: string | null
  extraido_por_ia?: boolean
  ia_confidence: number | null
  validado_at: string | null
  rechazado_motivo: string | null
  created_at?: string
}

export interface MetricaMensual {
  id: string
  empresa_id: string
  anio: number
  mes: number
  total_kg: number
  co2_ahorrado: number
  agua_ahorrada?: number
  energia_ahorrada?: number
  arboles_eq?: number
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

export interface VistaImpactoEmpresa {
  empresa_id: string
  empresa: string           // nombre de empresa desde la vista
  sector?: string
  total_kg: number
  co2_ahorrado: number
  agua_ahorrada?: number
  energia_ahorrada?: number
  arboles_eq?: number
  num_recolecciones: number
}
