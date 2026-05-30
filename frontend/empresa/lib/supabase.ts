import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const DEMO_EMPRESA_NOMBRE = 'Supermercados Norte S.R.L.'

let cachedEmpresaId: string | null = null

export async function getEmpresaId(): Promise<string | null> {
  if (cachedEmpresaId) return cachedEmpresaId

  const { data, error } = await supabase
    .from('empresas')
    .select('id')
    .ilike('nombre', `%${DEMO_EMPRESA_NOMBRE}%`)
    .limit(1)
    .maybeSingle()

  if (!error && data) {
    cachedEmpresaId = data.id
    return data.id
  }
  return null
}

export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
