'use client'
import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

interface DashData {
  empresa:  { nombre: string; sector: string | null; ciudad: string | null } | null
  mes:      { kg: number; co2: number; recolecciones: number }
  totales:  { kg: number; co2: number }
  estados:  Record<string, number>
  recientes: { id: string; estado: string; fecha_recoleccion: string; ia_confidence: number | null; notas: string | null }[]
}

const ESTADO_CFG: Record<string, { label: string; cls: string }> = {
  APROBADO:  { label: 'Aprobado',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  RECHAZADO: { label: 'Rechazado', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

// Tips de reciclaje por sector
const TIPS_POR_SECTOR: Record<string, { titulo: string; tips: string[] }> = {
  TECNOLOGIA: {
    titulo: 'Reciclaje en empresas tecnológicas',
    tips: [
      'Los equipos electrónicos (RAEE) como computadoras y celulares contienen metales valiosos — nunca los tires a la basura común.',
      'Los cables y periféricos viejos son reciclables. Agregalos en una caja separada para facilitar la recolección.',
      'Las baterías de laptops y UPS deben manejarse como residuos peligrosos. Fundares puede coordinar su retiro.',
      'Imprimí a doble cara y usá papel reciclado para reducir hasta un 50% el residuo de papel en oficinas tech.',
      'Los cartuchos de tóner vacíos tienen valor. Muchos fabricantes ofrecen programas de devolución.',
    ],
  },
  SALUD: {
    titulo: 'Reciclaje en el sector salud',
    tips: [
      'Separate los residuos comunes (papel, cartón, plástico) de los residuos bioinfecciosos — solo los comunes van con Fundares.',
      'El embalaje de insumos médicos (cajas de cartón, blísteres de plástico) es 100% reciclable si no tuvo contacto con pacientes.',
      'El papel administrativo (historias clínicas impresas, facturas) debe ser destruido antes de reciclarlo por privacidad.',
      'Los frascos de vidrio de medicamentos no vencidos pueden reciclarse si están limpios y secos.',
      'El aluminio de envases de medicamentos tiene alto valor de reciclaje — separalo del plástico mixto.',
    ],
  },
  EDUCACION: {
    titulo: 'Reciclaje en instituciones educativas',
    tips: [
      'El papel es el mayor residuo en centros educativos. Colocá papeleras diferenciadas en cada aula.',
      'Las impresiones de un solo lado pueden usarse como borrador antes de reciclarlas.',
      'Los marcadores y lapiceras agotadas son residuos especiales — alguns marcas tienen programas de devolución.',
      'Los cartuchos de tóner e impresora vacíos tienen alta demanda como reciclables de valor.',
      'Las revistas y libros en desuso pueden donarse antes de reciclarse — priorizá la reutilización.',
    ],
  },
  ALIMENTOS: {
    titulo: 'Reciclaje en empresas de alimentos',
    tips: [
      'Los envases de plástico PET (botellas de aceite, jugos) son los de mayor valor en el mercado de reciclaje.',
      'El cartón de embalajes de alimentos debe estar limpio y seco para ser reciclable — evitá la contaminación con grasa.',
      'El aceite vegetal de cocina usado es un residuo especial con alta demanda — no lo tires por el desagüe.',
      'Las latas de aluminio (conservas, bebidas) tienen el mayor valor por kg de todos los reciclables.',
      'El vidrio de envases de alimentos es 100% reciclable infinitas veces — separá por color para mayor valor.',
    ],
  },
  COMERCIO: {
    titulo: 'Reciclaje en empresas comerciales',
    tips: [
      'El cartón de embalajes es el residuo más voluminoso en comercio. Compactalo para reducir el volumen antes de la recolección.',
      'Los plásticos de burbujas y stretch film (polietileno) son reciclables — buscá puntos de acopio específicos.',
      'Las bolsas plásticas pueden reutilizarse varias veces antes de reciclarlas. Impulsá el uso de bolsas reutilizables.',
      'Las pallets de madera dañadas pueden reciclarse como madera — algunas empresas las compran para chips o biomasa.',
      'El papel de impresión y tiques de caja tienen valor como reciclable de papel — acumulalos por separado.',
    ],
  },
  MANUFACTURA: {
    titulo: 'Reciclaje en manufactura e industria',
    tips: [
      'Los recortes y rebabas metálicas (acero, aluminio, cobre) tienen muy alto valor en el mercado de chatarra.',
      'Los aceites industriales usados son residuos peligrosos que no deben mezclarse con otros reciclables.',
      'El cartón y plástico de embalaje industrial son reciclables en grandes volúmenes — ideales para Fundares.',
      'Los trapos y solventes contaminados deben manejarse por separado como residuos peligrosos.',
      'Las virutas de madera de carpintería pueden convertirse en biomasa o chip para otros procesos.',
    ],
  },
  CONSTRUCCION: {
    titulo: 'Reciclaje en el sector construcción',
    tips: [
      'El acero y fierro de construcción tienen el precio más alto en el mercado de reciclaje de metales.',
      'El papel y cartón de embalajes de materiales de construcción es 100% reciclable si está limpio.',
      'El cobre de cableado eléctrico tiene altísimo valor — separá siempre del resto de la chatarra.',
      'Los plásticos PVC de cañerías pueden reciclarse en instalaciones especializadas.',
      'El vidrio de ventanas rotas puede reciclarse — agrupalo en contenedores seguros para evitar accidentes.',
    ],
  },
  SERVICIOS: {
    titulo: 'Reciclaje en empresas de servicios',
    tips: [
      'El papel de oficina es tu principal reciclable — instalá recipientes separados en cada espacio de trabajo.',
      'Las botellas plásticas del comedor o cafetería son fáciles de separar y tienen buen valor de reciclaje.',
      'Los cartuchos de impresora vacíos son reciclables y algunas marcas los recompran.',
      'El cartón de entregas y pedidos es 100% reciclable — aplastalo para ahorrar espacio.',
      'Promové el uso de vasos reutilizables entre tu equipo para reducir el residuo plástico de un solo uso.',
    ],
  },
  OTRO: {
    titulo: 'Consejos generales de reciclaje',
    tips: [
      'Separar los residuos en origen (papel, plástico, vidrio, metal) mejora la calidad y el valor del reciclaje.',
      'El reciclable más valioso es el que está limpio y seco — enjuagá envases antes de separarlos.',
      'Coordiná con Fundares para definir el material que más genera tu empresa y optimizá la recolección.',
      'Reducir siempre es mejor que reciclar — evaluá cómo reducir el uso de envases y papel en tu operación.',
      'Identificá a la persona responsable de reciclaje en tu empresa para hacer el proceso más eficiente.',
    ],
  },
}

export default function EmpresaDashboard() {
  const { profile } = useAuth()
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.empresa_id) { setLoading(false); return }
    fetch(`/api/empresa/dashboard?empresa_id=${profile.empresa_id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profile])

  const aprobados  = data?.estados?.APROBADO  ?? 0
  const rechazados = data?.estados?.RECHAZADO ?? 0
  const total      = Object.values(data?.estados ?? {}).reduce((s, v) => s + v, 0)

  // Mostrar total acumulado si este mes es 0 (datos históricos)
  const kgMostrar  = (data?.mes.kg  ?? 0) > 0 ? data!.mes.kg  : (data?.totales?.kg  ?? 0)
  const co2Mostrar = (data?.mes.co2 ?? 0) > 0 ? data!.mes.co2 : (data?.totales?.co2 ?? 0)
  const subKg      = (data?.mes.kg  ?? 0) > 0 ? 'este mes' : 'total acumulado'
  const subCo2     = (data?.mes.co2 ?? 0) > 0 ? 'kg equiv. este mes' : 'kg equiv. acumulado'

  const stats = [
    {
      label: 'Kg reciclados', sub: loading ? '…' : subKg,
      value: loading ? '—' : kgMostrar.toFixed(1),
      accent: 'bg-emerald-500', shadow: 'shadow-emerald-500/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2z" clipRule="evenodd" /></svg>,
    },
    {
      label: 'CO₂ ahorrado', sub: loading ? '…' : subCo2,
      value: loading ? '—' : co2Mostrar.toFixed(1),
      accent: 'bg-sky-500', shadow: 'shadow-sky-500/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4.464 3.162A2 2 0 016.28 2h7.44a2 2 0 011.816 1.162l1.154 2.5c.067.145.115.298.143.456C16.941 6.038 17 6 17 6a1 1 0 110 2c-.185 0-.364-.043-.527-.12-.055.468-.27.9-.607 1.224a3.5 3.5 0 01-4.732 0 3.5 3.5 0 01-4.732 0A2.01 2.01 0 016 9V6.86A.997.997 0 015 7a1 1 0 110-2h.006a2.01 2.01 0 01.304-.838l1.154-2Z" /><path fillRule="evenodd" d="M6 11a1 1 0 011 1v3h6v-3a1 1 0 112 0v3.5A1.5 1.5 0 0113.5 17h-7A1.5 1.5 0 015 15.5V12a1 1 0 011-1z" clipRule="evenodd" /></svg>,
    },
    {
      label: 'Recolecciones', sub: 'total registradas',
      value: loading ? '—' : String(total),
      accent: 'bg-violet-500', shadow: 'shadow-violet-500/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>,
    },
    {
      label: 'Rechazadas', sub: rechazados > 0 ? 'requieren atención' : 'sin problemas',
      value: loading ? '—' : String(rechazados),
      accent: rechazados > 0 ? 'bg-rose-500' : 'bg-slate-400',
      shadow: rechazados > 0 ? 'shadow-rose-500/20' : 'shadow-slate-400/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {loading ? '...' : (data?.empresa?.nombre ?? 'Mi empresa')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {data?.empresa?.sector && <span>{data.empresa.sector}</span>}
          {data?.empresa?.sector && data?.empresa?.ciudad && <span className="mx-1.5">·</span>}
          {data?.empresa?.ciudad && <span>{data.empresa.ciudad}</span>}
          {!data?.empresa?.sector && !data?.empresa?.ciudad && 'Resumen de impacto ambiental'}
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <motion.div key={s.label} variants={item}>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 h-full">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${s.accent} flex items-center justify-center text-white shadow-lg ${'shadow' in s ? s.shadow : ''}`}>
                  {s.icon}
                </div>
                {('pulse' in s) && Boolean((s as { pulse?: boolean }).pulse) && (
                  <span className="relative flex h-2 w-2 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{s.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h2 className="font-semibold text-slate-900 mb-1">Estado de recolecciones</h2>
          <p className="text-xs text-slate-400 mb-5">{total} registros en total</p>

          {total === 0 && !loading ? (
            <p className="text-sm text-slate-400 text-center py-6">Sin recolecciones aún.</p>
          ) : (
            <div className="space-y-3">
              {[
                { key: 'APROBADO',  label: 'Aprobadas',  color: 'bg-emerald-500', count: aprobados },
                { key: 'RECHAZADO', label: 'Rechazadas', color: 'bg-rose-400',    count: rechazados },
              ].map(({ label, color, count }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">{label}</span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent collections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h2 className="font-semibold text-slate-900 mb-1">Últimas recolecciones</h2>
          <p className="text-xs text-slate-400 mb-4">Los 5 registros más recientes</p>

          {!loading && (!data?.recientes?.length) ? (
            <p className="text-sm text-slate-400 text-center py-6">Sin recolecciones registradas.</p>
          ) : loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {data!.recientes.map(r => {
                const cfg = ESTADO_CFG[r.estado] ?? { label: r.estado, cls: 'bg-slate-100 text-slate-500' }
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                      {r.notas && <p className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5">{r.notas}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Tips de reciclaje por sector */}
        {(() => {
          const sector  = data?.empresa?.sector || 'OTRO'
          const content = TIPS_POR_SECTOR[sector] || TIPS_POR_SECTOR['OTRO']
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100"
                style={{ background: 'linear-gradient(135deg, #e8f5ec 0%, #f0faf9 100%)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: '#1e9070', color: '#fff' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[14px] font-bold" style={{ color: '#1e9070' }}>{content.titulo}</h2>
                  <p className="text-[11.5px] mt-0.5" style={{ color: '#4a7a5c' }}>
                    Sector: <strong>{sector.charAt(0) + sector.slice(1).toLowerCase()}</strong> · Consejos personalizados para tu empresa
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="p-5 space-y-3">
                {content.tips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: 'var(--gray-50)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e8f5ec')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                      style={{ background: '#1e9070' }}>
                      {i + 1}
                    </span>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {tip}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="px-5 pb-4">
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Fundares Bolivia · EcoScore — Tips basados en las mejores prácticas de reciclaje industrial para tu sector.
                </p>
              </div>
            </motion.div>
          )
        })()}
    </div>
  )
}
