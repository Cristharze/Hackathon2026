'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/lib/types'
import Link from 'next/link'

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase.from('empresas').select('*').order('nombre')
      if (error) setError(error.message)
      else setEmpresas(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const filtered = empresas.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (e.ciudad || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.sector || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas Aliadas</h1>
          <p className="text-sm text-gray-500 mt-1">{empresas.length} empresas registradas</p>
        </div>
        <input
          type="search"
          placeholder="Buscar empresa..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Cargando...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3">Ciudad</th>
                <th className="px-5 py-3">Contacto</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{e.nombre}</td>
                  <td className="px-5 py-3 text-gray-600">{e.sector || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{e.ciudad || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{e.contacto || e.email || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      e.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {e.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/empresas/${e.id}`}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
