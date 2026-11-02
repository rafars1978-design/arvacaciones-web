import React, { useEffect, useState } from 'react'
import { Copy, Check, RefreshCcw } from 'lucide-react'
import { api } from '../lib/api'

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const STATUS = {
  por_pagar: { label: 'Por pagar', cls: 'bg-amber-100 text-amber-700' },
  pendiente: { label: 'Falta check-out', cls: 'bg-slate-100 text-slate-600' },
  pagada: { label: 'Pagada', cls: 'bg-green-100 text-green-700' }
}

// Admin: broker links + commission report (built from the broker tag stored in Smoobu reservations)
function BrokersPanel({ token }) {
  const [brokers, setBrokers] = useState([])
  const [siteUrl, setSiteUrl] = useState('')
  const [report, setReport] = useState({ rows: [], totals: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [paying, setPaying] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [b, r] = await Promise.all([api.getBrokers(token), api.getBrokerReport(token)])
      setBrokers(b.brokers || [])
      setSiteUrl(b.siteUrl || window.location.origin)
      setReport(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch { /* clipboard blocked */ }
  }

  const pay = async (row) => {
    if (!window.confirm(`¿Marcar como pagada la comisión de ${row.broker} (${money(row.commissionUsd)} USD)?`)) return
    try {
      setPaying(String(row.id))
      await api.payBroker({ reservationId: row.id }, token)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setPaying('')
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-border p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Brokers y comisiones</h2>
          <p className="text-sm text-muted mt-1">
            Cada broker comparte su enlace. Las reservas que entren por él quedan marcadas y su comisión se calcula sobre el hospedaje (después de descuento, sin limpieza ni IVA).
          </p>
        </div>
        <button onClick={load} className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm flex items-center gap-2 hover:border-primary">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}

      <div>
        <h3 className="font-semibold text-foreground mb-3">Enlaces de brokers</h3>
        {brokers.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay brokers dados de alta.</p>
        ) : (
          <div className="space-y-2">
            {brokers.map((b) => {
              const link = `${siteUrl}/?b=${b.code}`
              const t = report.totals[b.code] || { porPagar: 0, pendiente: 0, pagada: 0 }
              return (
                <div key={b.code} className="rounded-2xl border border-border p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{b.name} <span className="text-muted font-normal">· {b.code} · {Math.round(b.rate * 100)}%{b.active ? '' : ' · inactivo'}</span></p>
                    <p className="text-sm text-muted truncate">{link}</p>
                  </div>
                  <div className="text-sm text-muted flex gap-4">
                    <span>Por pagar: <strong className="text-foreground">{money(t.porPagar)}</strong></span>
                    <span>Falta check-out: <strong className="text-foreground">{money(t.pendiente)}</strong></span>
                    <span>Pagado: <strong className="text-foreground">{money(t.pagada)}</strong></span>
                  </div>
                  <button onClick={() => copy(link, b.code)} className="rounded-xl bg-primary text-white px-4 py-2 text-sm flex items-center gap-2">
                    {copied === b.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === b.code ? 'Copiado' : 'Copiar enlace'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Reservas de brokers</h3>
        {report.rows.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay reservas hechas por brokers.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2 pr-3">Broker</th>
                  <th className="py-2 pr-3">Propiedad</th>
                  <th className="py-2 pr-3">Huésped</th>
                  <th className="py-2 pr-3">Fechas</th>
                  <th className="py-2 pr-3 text-right">Comisión USD</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium">{r.broker}</td>
                    <td className="py-2 pr-3">{r.property}</td>
                    <td className="py-2 pr-3">{r.guest}{r.ref ? <span className="block text-xs text-muted">{r.ref}</span> : null}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{r.arrival} → {r.departure}</td>
                    <td className="py-2 pr-3 text-right">{money(r.commissionUsd)}</td>
                    <td className="py-2 pr-3"><span className={`px-2 py-1 rounded-full text-xs ${STATUS[r.status].cls}`}>{STATUS[r.status].label}{r.paidOn ? ` · ${r.paidOn}` : ''}</span></td>
                    <td className="py-2 text-right">
                      {r.status === 'por_pagar' && (
                        <button onClick={() => pay(r)} disabled={paying === String(r.id)} className="rounded-lg border border-border px-3 py-1 text-xs hover:border-primary disabled:opacity-50">
                          Marcar pagada
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrokersPanel
