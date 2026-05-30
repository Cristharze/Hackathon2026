'use client'

import { useEffect, useState } from 'react'
import { supabase, getEmpresaId } from '@/lib/supabase'
import { Recycle, TrendingDown, BookOpen, Lightbulb } from 'lucide-react'

interface Tip {
  id: string
  titulo: string
  contenido: string
  categoria: 'reciclaje' | 'reduccion' | 'educacion' | string
  created_at: string
}

const CATEGORY_CONFIG: Record<string, {
  label: string; bg: string; border: string; badge: string; text: string; icon: React.ElementType
}> = {
  reciclaje: {
    label: 'Reciclaje',
    bg: 'bg-green-50',
    border: 'border-green-100',
    badge: 'bg-green-100 text-green-700',
    text: 'text-green-900',
    icon: Recycle,
  },
  reduccion: {
    label: 'Reducción',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    badge: 'bg-blue-100 text-blue-700',
    text: 'text-blue-900',
    icon: TrendingDown,
  },
  educacion: {
    label: 'Educación',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    badge: 'bg-purple-100 text-purple-700',
    text: 'text-purple-900',
    icon: BookOpen,
  },
}

const DEFAULT: typeof CATEGORY_CONFIG[string] = {
  label: 'Consejo',
  bg: 'bg-amber-50',
  border: 'border-amber-100',
  badge: 'bg-amber-100 text-amber-700',
  text: 'text-amber-900',
  icon: Lightbulb,
}

const GENERIC_TIPS: Omit<Tip, 'id' | 'created_at'>[] = [
  {
    titulo: 'Separa tus residuos desde la fuente',
    contenido: 'Mantén contenedores separados para plástico, papel, vidrio y orgánicos. Una buena separación aumenta la tasa de reciclaje hasta un 40% y facilita el trabajo del recolector.',
    categoria: 'reciclaje',
  },
  {
    titulo: 'Limpia los envases antes de reciclar',
    contenido: 'Enjuaga latas, botellas y envases para eliminar residuos de alimentos. Los materiales sucios contaminan otros reciclables y pueden inutilizar cargas enteras.',
    categoria: 'reciclaje',
  },
  {
    titulo: 'Reduce el uso de plásticos de un solo uso',
    contenido: 'Bolsas reutilizables, botellas rellenables y vajilla de vidrio reducen significativamente la cantidad de residuos que generas cada día. Menos residuos = menos trabajo de reciclaje.',
    categoria: 'reduccion',
  },
  {
    titulo: 'Compra en formato grande o a granel',
    contenido: 'Comprar en mayor volumen reduce el empaque por unidad. Considera proveedores que ofrezcan opciones a granel para reducir la cantidad de envases que terminan como residuo.',
    categoria: 'reduccion',
  },
  {
    titulo: '¿Qué se puede reciclar?',
    contenido: 'Plásticos (PET, HDPE), cartón seco, vidrio, metales (aluminio y acero) y papel periódico son los más comunes. Evita mezclar con residuos orgánicos o material mojado que contamina el lote.',
    categoria: 'educacion',
  },
  {
    titulo: 'El reciclaje ahorra energía',
    contenido: 'Reciclar aluminio consume un 95% menos de energía que producirlo desde cero. Cada kilo de aluminio reciclado equivale a ahorrar 8 kWh de electricidad — suficiente para encender una lámpara por 80 horas.',
    categoria: 'educacion',
  },
]

export default function TipsPage() {
  const [loading, setLoading] = useState(true)
  const [tips, setTips] = useState<Tip[]>([])
  const [usandoGenericos, setUsandoGenericos] = useState(false)
  const [filtro, setFiltro] = useState<string>('todos')

  useEffect(() => { loadTips() }, [])

  async function loadTips() {
    try {
      setLoading(true)
      const empresaId = await getEmpresaId()

      if (empresaId) {
        const { data, error } = await supabase
          .from('tips_empresa')
          .select('id, titulo, contenido, categoria, created_at')
          .eq('empresa_id', empresaId)
          .eq('estado', 'activo')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          setTips(data)
          setUsandoGenericos(false)
          return
        }
      }

      // Fallback to generic tips
      setTips(GENERIC_TIPS.map((t, i) => ({ ...t, id: `gen-${i}`, created_at: '' })))
      setUsandoGenericos(true)
    } catch {
      setTips(GENERIC_TIPS.map((t, i) => ({ ...t, id: `gen-${i}`, created_at: '' })))
      setUsandoGenericos(true)
    } finally {
      setLoading(false)
    }
  }

  const categorias = ['todos', ...Array.from(new Set(tips.map(t => t.categoria)))]
  const tipsFiltrados = filtro === 'todos' ? tips : tips.filter(t => t.categoria === filtro)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tips y Recomendaciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          {usandoGenericos
            ? 'Consejos generales sobre reciclaje y reducción de residuos'
            : `${tips.length} recomendaciones personalizadas para tu empresa`}
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => {
          const cfg = cat === 'todos' ? null : (CATEGORY_CONFIG[cat] ?? DEFAULT)
          const active = filtro === cat
          return (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
              }`}
            >
              {cat === 'todos' ? 'Todos' : (cfg?.label ?? cat)}
            </button>
          )
        })}
      </div>

      {/* Tips grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tipsFiltrados.map(tip => {
          const cfg = CATEGORY_CONFIG[tip.categoria] ?? DEFAULT
          const Icon = cfg.icon
          return (
            <div key={tip.id} className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <h3 className={`font-semibold text-sm leading-snug ${cfg.text}`}>{tip.titulo}</h3>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{tip.contenido}</p>
              {tip.created_at && (
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(tip.created_at).toLocaleDateString('es-BO')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {tipsFiltrados.length === 0 && (
        <p className="text-gray-400 text-center py-8 text-sm">
          No hay tips en esta categoría.
        </p>
      )}
    </div>
  )
}
