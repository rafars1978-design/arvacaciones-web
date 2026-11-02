import React, { useEffect, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { api } from '../lib/api'
import PropertyEditor from './PropertyEditor'

const money = (n, c) => `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}${c ? ` ${c}` : ''}`

// Admin: the properties the public site shows right now (live from Smoobu), and why any is hidden
function CatalogPanel({ token }) {
  const [data, setData] = useState({ items: [], published: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState('')

  const load = async (refresh) => {
    try {
      setLoading(true)
      setError('')
      setData(await api.getCatalog(token, refresh))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(false) }, [])

  return (
    <div className="rounded-3xl bg-white border border-border p-6 md:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Propiedades publicadas</h2>
          <p className="text-sm text-muted mt-1">
            Esto es lo que ve el público hoy, tomado de Smoobu: {data.published} publicadas de {data.items.length}. Los precios, la estancia mínima y la disponibilidad se cambian en Smoobu y se reflejan solos.
          </p>
        </div>
        <button onClick={() => load(true)} className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm flex items-center gap-2 hover:border-primary">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 pr-3">Propiedad</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3 text-right">Desde / noche</th>
              <th className="py-2 pr-3 text-right">Mín. noches</th>
              <th className="py-2 pr-3 text-right">Limpieza</th>
              <th className="py-2 pr-3 text-right">Huésp. / rec.</th>
              <th className="py-2 pr-3 text-right">Fotos</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i.id} className="border-b border-border/60">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-3">
                    {i.image ? <img src={i.image} alt="" className="w-12 h-9 rounded-md object-cover" loading="lazy" /> : <div className="w-12 h-9 rounded-md bg-beige" />}
                    <span className="font-medium">{i.name}</span>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  {i.published
                    ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Publicada</span>
                    : <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600" title={i.reason}>Oculta · {i.reason}</span>}
                </td>
                <td className="py-2 pr-3 text-right">{i.published ? money(i.price, i.currency) : '—'}</td>
                <td className="py-2 pr-3 text-right">{i.published ? i.minNights : '—'}</td>
                <td className="py-2 pr-3 text-right">{i.cleaningFee ? money(i.cleaningFee) : '—'}</td>
                <td className="py-2 pr-3 text-right">{i.published ? `${i.guests} / ${i.bedrooms}` : '—'}</td>
                <td className="py-2 pr-3 text-right">{i.photos || '—'}</td>
                <td className="py-2 text-right">
                  <button onClick={() => setEditing(i.id)} className="rounded-lg border border-border px-3 py-1 text-xs hover:border-primary">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <PropertyEditor id={editing} token={token} onClose={() => setEditing('')} onSaved={() => load(true)} />}
    </div>
  )
}

export default CatalogPanel
