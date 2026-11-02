import React, { useEffect, useState } from 'react'
import { Copy, Check, RefreshCcw, UserPlus, MessageCircle } from 'lucide-react'
import { api } from '../lib/api'

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const STATUS = {
  por_pagar: { label: 'Por pagar', cls: 'bg-amber-100 text-amber-700' },
  pendiente: { label: 'Falta check-out', cls: 'bg-slate-100 text-slate-600' },
  pagada: { label: 'Pagada', cls: 'bg-green-100 text-green-700' }
}

const messageFor = (name, link, siteUrl, rate = 0.1) =>
  `Hola ${name}, este es tu enlace personal de AR Vacaciones para reservar con tus clientes: ${link}\n\n` +
  `Cada reserva que entre por él queda registrada a tu nombre y te pagamos el ${Math.round(rate * 100)}% de comisión después del check-out. ` +
  `Más información: ${siteUrl}/#/brokers`

// Admin: register brokers, hand out their links and follow commissions
function BrokersPanel({ token }) {
  const [brokers, setBrokers] = useState([])
  const [siteUrl, setSiteUrl] = useState('')
  const [report, setReport] = useState({ rows: [], totals: {}, brokers: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [paying, setPaying] = useState('')
  const [form, setForm] = useState({ name: '', percent: 10 })
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [b, r] = await Promise.all([api.getBrokers(token), api.getBrokerReport(token)])
      setBrokers(b.brokers || [])
      setSiteUrl(b.siteUrl || window.location.origin)
      setReport({ rows: [], totals: {}, brokers: [], ...r })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Brokers created here plus any that already have bookings in Smoobu (so none ever disappears)
  const allBrokers = [...brokers]
  ;(report.brokers || []).forEach((b) => {
    if (!allBrokers.some((x) => x.code === b.code)) allBrokers.push({ ...b, active: true })
  })

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch { /* clipboard blocked */ }
  }

  const create = async (e) => {
    e.preventDefault()
    try {
      setCreating(true)
      setError('')
      const result = await api.createBroker({ name: form.name, percent: Number(form.percent) }, token)
      setCreated({ ...result.broker, link: result.link })
      setForm({ name: '', percent: form.percent })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
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

  const CopyBtn = ({ text, id, children, primary }) => (
    <button
      type="button"
      onClick={() => copy(text, id)}
      className={`rounded-xl px-4 py-2 text-sm flex items-center gap-2 ${primary ? 'bg-primary text-white' : 'border border-border hover:border-primary'}`}
    >
      {copied === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === id ? 'Copiado' : children}
    </button>
  )

  return (
    <div className="rounded-3xl bg-white border border-border p-6 md:p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Brokers y comisiones</h2>
          <p className="text-sm text-muted mt-1">
            Da de alta a cada broker, cópiale su enlace y sigue sus reservas. La comisión se calcula sobre el hospedaje (después de descuento, sin limpieza ni IVA) y se paga después del check-out.
          </p>
        </div>
        <button onClick={load} className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm flex items-center gap-2 hover:border-primary">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}

      <div className="rounded-2xl bg-beige p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Dar de alta un broker</h3>
        <form onSubmit={create} className="flex flex-col md:flex-row gap-3 md:items-end">
          <label className="flex-1 text-sm">
            <span className="block text-muted mb-1">Nombre del broker</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. María López"
              required
              className="w-full border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm md:w-32">
            <span className="block text-muted mb-1">Comisión %</span>
            <input
              type="number"
              min="1"
              max="30"
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: e.target.value })}
              required
              className="w-full border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-primary"
            />
          </label>
          <button disabled={creating} className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl px-5 py-2.5 text-sm font-medium">
            {creating ? 'Creando…' : 'Dar de alta y generar enlace'}
          </button>
        </form>

        {created && (
          <div className="mt-4 rounded-xl bg-white border border-primary/40 p-4">
            <p className="text-sm text-foreground font-medium">Listo: {created.name} ({Math.round(created.rate * 100)}%). Este es el enlace que le tienes que dar:</p>
            <p className="text-sm text-primary break-all my-2">{created.link}</p>
            <div className="flex flex-wrap gap-2">
              <CopyBtn text={created.link} id="new-link" primary>Copiar enlace</CopyBtn>
              <CopyBtn text={messageFor(created.name, created.link, siteUrl, created.rate)} id="new-msg">Copiar mensaje listo para enviar</CopyBtn>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Brokers y sus enlaces</h3>
        {allBrokers.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay brokers dados de alta.</p>
        ) : (
          <div className="space-y-2">
            {allBrokers.map((b) => {
              const link = `${siteUrl}/?b=${b.code}`
              const t = report.totals[b.code] || { porPagar: 0, pendiente: 0, pagada: 0 }
              return (
                <div key={b.code} className="rounded-2xl border border-border p-4 flex flex-col xl:flex-row xl:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {b.name} <span className="text-muted font-normal">· {Math.round(b.rate * 100)}%{b.active === false ? ' · desactivado' : ''}</span>
                    </p>
                    <p className="text-sm text-muted break-all">{link}</p>
                  </div>
                  <div className="text-sm text-muted flex flex-wrap gap-x-4 gap-y-1">
                    <span>Por pagar: <strong className="text-foreground">{money(t.porPagar)}</strong></span>
                    <span>Falta check-out: <strong className="text-foreground">{money(t.pendiente)}</strong></span>
                    <span>Pagado: <strong className="text-foreground">{money(t.pagada)}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyBtn text={link} id={`l-${b.code}`} primary>Copiar enlace</CopyBtn>
                    <button
                      type="button"
                      onClick={() => copy(messageFor(b.name, link, siteUrl, b.rate), `m-${b.code}`)}
                      className="rounded-xl border border-border hover:border-primary px-4 py-2 text-sm flex items-center gap-2"
                    >
                      {copied === `m-${b.code}` ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />} {copied === `m-${b.code}` ? 'Copiado' : 'Copiar mensaje'}
                    </button>
                  </div>
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
                    <td className="py-2 pr-3 font-medium">{(report.brokers || []).find((b) => b.code === r.broker)?.name || r.broker}</td>
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
