import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { auth } from '../lib/auth'
import BrokersPanel from '../components/BrokersPanel'
import CatalogPanel from '../components/CatalogPanel'
import { Lock, LogOut } from 'lucide-react'

function AdminPage() {
  const [token, setToken] = useState(auth.getToken())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loginMsg, setLoginMsg] = useState('')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (token) api.getSmoobuStatus().then(setStatus).catch(() => setStatus({ connected: false }))
  }, [token])

  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      setError('')
      setLoginMsg('Conectando con el servidor… Si es la primera vez del día puede tardar hasta 60 segundos.')
      const response = await api.login(credentials)
      auth.setToken(response.token)
      setToken(response.token)
      setLoginMsg('')
    } catch (err) {
      setLoginMsg('')
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    auth.clear()
    setToken('')
    setStatus(null)
    setError('')
  }

  if (!token) {
    return (
      <section className="pt-36 pb-20 px-4 md:px-8 min-h-screen bg-beige">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-muted">Panel AR Vacaciones</p>
              <h1 className="font-display text-3xl font-bold text-foreground">Administrador</h1>
            </div>
          </div>

          <p className="text-muted mb-6">
            Aquí ves las propiedades publicadas y administras a tus brokers y sus comisiones.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Correo</label>
              <input
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Contraseña</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
              />
            </div>
            {loginMsg && <div className="rounded-2xl bg-blue-50 text-blue-700 px-4 py-3 text-sm">{loginMsg}</div>}
            {error && <div className="rounded-2xl bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-foreground text-white py-3 font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Conectando con servidor...' : 'Entrar al panel'}
            </button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-28 pb-20 px-4 md:px-8 bg-beige min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-primary font-semibold">Panel operativo</p>
            <h1 className="font-display text-4xl font-bold text-foreground">Administrador</h1>
            {status && (
              <p className="text-sm text-muted mt-2">
                Sistema de reservas: <strong>{status.connected ? 'conectado' : 'sin conexión'}</strong>
              </p>
            )}
          </div>
          <button onClick={handleLogout} className="self-start rounded-2xl border border-border bg-white px-5 py-3 font-medium flex items-center gap-2 hover:border-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>

        <BrokersPanel token={token} />
        <CatalogPanel token={token} />
      </div>
    </section>
  )
}

export default AdminPage
