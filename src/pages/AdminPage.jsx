import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { auth } from '../lib/auth'
import { Lock, Plus, Pencil, Trash2, Image as ImageIcon, RefreshCcw, LogOut, BedDouble, Bath, Users, Link2 } from 'lucide-react'

const emptyForm = {
  name: '',
  location: 'Playa del Carmen',
  price: 250,
  rating: 4.9,
  reviews: 0,
  guests: 4,
  bedrooms: 2,
  bathrooms: 2,
  image: '',
  gallery: '',
  amenities: 'WiFi Premium, Alberca, Excelente ubicación',
  summary: '',
  smoobuApartmentId: '',
  active: true,
  featured: false,
}

function AdminPage() {
  const [token, setToken] = useState(auth.getToken())
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null)
  const [credentials, setCredentials] = useState({ email: 'admin@arvacaciones.com', password: 'Admin123!' })
  const [form, setForm] = useState(emptyForm)

  const galleryPreview = useMemo(
    () => form.gallery.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 4),
    [form.gallery]
  )

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [propertiesResponse, statusResponse] = await Promise.all([
        api.getAdminProperties(token),
        api.getSmoobuStatus().catch(() => ({ connected: false, mode: 'offline' }))
      ])
      setProperties(propertiesResponse.properties || [])
      setStatus(statusResponse)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadData()
  }, [token])

  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      setError('')
      const response = await api.login(credentials)
      auth.setToken(response.token)
      setToken(response.token)
      setMessage('Acceso correcto al panel administrador.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      setError('')
      setMessage('')
      const payload = {
        ...form,
        price: Number(form.price),
        rating: Number(form.rating),
        reviews: Number(form.reviews),
        guests: Number(form.guests),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
      }

      if (editingId) {
        await api.updateProperty(editingId, payload, token)
        setMessage('Propiedad actualizada correctamente.')
      } else {
        await api.createProperty(payload, token)
        setMessage('Propiedad creada correctamente.')
      }

      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (property) => {
    setEditingId(property.id)
    setForm({
      ...property,
      price: Number(property.price || 0),
      rating: Number(property.rating || 0),
      reviews: Number(property.reviews || 0),
      guests: Number(property.guests || 1),
      bedrooms: Number(property.bedrooms || 1),
      bathrooms: Number(property.bathrooms || 1),
      image: String(property.image || ''),
      gallery: Array.isArray(property.gallery)
        ? property.gallery.join(', ')
        : String(property.gallery || ''),
      amenities: Array.isArray(property.amenities)
        ? property.amenities.join(', ')
        : String(property.amenities || ''),
      summary: String(property.summary || ''),
      smoobuApartmentId:
        typeof property.smoobuApartmentId === 'string' || typeof property.smoobuApartmentId === 'number'
          ? String(property.smoobuApartmentId)
          : '',
      active: Boolean(property.active),
      featured: Boolean(property.featured),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta propiedad?')) return
    try {
      setSaving(true)
      setError('')
      await api.deleteProperty(id, token)
      setMessage('Propiedad eliminada.')
      await loadData()
      if (editingId === id) resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    auth.clear()
    setToken('')
    setProperties([])
    setStatus(null)
    setMessage('')
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
            Conservamos el diseño público y aquí controlas propiedades, galerías y el vínculo futuro con Smoobu.
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
            {error && <div className="rounded-2xl bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-foreground text-white py-3 font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Ingresando...' : 'Entrar al panel'}
            </button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-32 pb-20 px-4 md:px-8 bg-beige min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-primary font-semibold">Panel operativo</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Administrador de propiedades</h1>
            <p className="text-muted mt-3 max-w-3xl">
              Aquí das de alta propiedades, actualizas imágenes, activas o desactivas visibilidad y preparas el mapeo con Smoobu sin tocar el diseño principal del sitio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={loadData} className="rounded-2xl border border-border bg-white px-5 py-3 font-medium flex items-center gap-2 hover:border-primary transition-colors">
              <RefreshCcw className="w-4 h-4" /> Actualizar
            </button>
            <button onClick={handleLogout} className="rounded-2xl border border-border bg-white px-5 py-3 font-medium flex items-center gap-2 hover:border-red-400 transition-colors">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>

        {status && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-white border border-border p-6">
              <p className="text-sm text-muted mb-2">Estado Smoobu</p>
              <p className="text-2xl font-semibold text-foreground">{status.connected ? 'Conectado' : 'Modo demo'}</p>
              <p className="text-sm text-muted mt-2">{status.message}</p>
            </div>
            <div className="rounded-3xl bg-white border border-border p-6">
              <p className="text-sm text-muted mb-2">Propiedades visibles</p>
              <p className="text-2xl font-semibold text-foreground">{properties.filter((item) => item.active).length}</p>
              <p className="text-sm text-muted mt-2">Se muestran en la home pública.</p>
            </div>
            <div className="rounded-3xl bg-white border border-border p-6">
              <p className="text-sm text-muted mb-2">Mapeadas con Smoobu</p>
              <p className="text-2xl font-semibold text-foreground">{properties.filter((item) => item.smoobuApartmentId).length}</p>
              <p className="text-sm text-muted mt-2">Listas para sincronizar disponibilidad y precio.</p>
            </div>
          </div>
        )}

        {error && <div className="rounded-2xl bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}
        {message && <div className="rounded-2xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">{message}</div>}

        <div className="grid xl:grid-cols-[1.1fr,0.9fr] gap-8">
          <motion.form layout onSubmit={handleSubmit} className="rounded-3xl bg-white border border-border p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground">{editingId ? 'Editar propiedad' : 'Nueva propiedad'}</h2>
                <p className="text-muted mt-2">No cambiamos el diseño. Solo alimentas el contenido real desde aquí.</p>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-2xl border border-border px-4 py-2 font-medium hover:border-primary transition-colors">
                  Cancelar edición
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
              <Field label="Ubicación" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
              <Field label="Precio por noche" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} />
              <Field label="Calificación" type="number" step="0.1" value={form.rating} onChange={(value) => setForm({ ...form, rating: value })} />
              <Field label="Reseñas" type="number" value={form.reviews} onChange={(value) => setForm({ ...form, reviews: value })} />
              <Field label="Smoobu apartment ID" value={form.smoobuApartmentId} onChange={(value) => setForm({ ...form, smoobuApartmentId: value })} />
              <Field label="Huéspedes" type="number" value={form.guests} onChange={(value) => setForm({ ...form, guests: value })} icon={<Users className="w-4 h-4 text-muted" />} />
              <Field label="Recámaras" type="number" value={form.bedrooms} onChange={(value) => setForm({ ...form, bedrooms: value })} icon={<BedDouble className="w-4 h-4 text-muted" />} />
              <Field label="Baños" type="number" value={form.bathrooms} onChange={(value) => setForm({ ...form, bathrooms: value })} icon={<Bath className="w-4 h-4 text-muted" />} />
              <Field label="Imagen principal" value={form.image} onChange={(value) => setForm({ ...form, image: value })} icon={<Link2 className="w-4 h-4 text-muted" />} />
            </div>

            <Field label="Amenidades (separadas por coma)" value={form.amenities} onChange={(value) => setForm({ ...form, amenities: value })} />
            <Field label="Galería (URLs separadas por coma)" value={form.gallery} onChange={(value) => setForm({ ...form, gallery: value })} />
            <TextArea label="Resumen" value={form.summary} onChange={(value) => setForm({ ...form, summary: value })} />

            <div className="flex flex-wrap gap-6 text-sm font-medium text-foreground">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible en web</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Destacada</label>
            </div>

            <button type="submit" disabled={saving} className="rounded-2xl bg-primary text-white px-6 py-3 font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2">
              <Plus className="w-4 h-4" /> {saving ? 'Guardando...' : editingId ? 'Actualizar propiedad' : 'Crear propiedad'}
            </button>
          </motion.form>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-beige flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-foreground">Vista previa rápida</h3>
                  <p className="text-sm text-muted">Cómo se verá la tarjeta principal.</p>
                </div>
              </div>

              <div className="rounded-3xl overflow-hidden border border-border bg-surface">
                <div className="aspect-[4/3] bg-beige">
                  {form.image ? (
                    <img src={form.image} alt={form.name || 'Preview'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted text-sm">Pega una URL de imagen</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="font-display text-2xl font-semibold text-foreground">{form.name || 'Nombre de la propiedad'}</h4>
                    <span className="text-lg font-semibold text-foreground">${Number(form.price || 0)}</span>
                  </div>
                  <p className="text-sm text-muted mb-3">{form.location || 'Playa del Carmen'}</p>
                  <p className="text-sm text-muted line-clamp-2">{form.summary || 'Aquí aparecerá el resumen corto de la propiedad.'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.amenities.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3).map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full bg-beige text-xs font-medium text-muted">{item}</span>
                    ))}
                  </div>
                </div>
              </div>

              {galleryPreview.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {galleryPreview.map((image) => (
                    <div key={image} className="aspect-[4/3] rounded-2xl overflow-hidden border border-border">
                      <img src={image} alt="Galería" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white border border-border p-6 shadow-sm">
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Propiedades cargadas</h3>
              <div className="space-y-4 max-h-[50rem] overflow-auto pr-1">
                {loading ? (
                  <div className="text-muted text-sm">Cargando propiedades...</div>
                ) : properties.map((property) => (
                  <div key={property.id} className="rounded-2xl border border-border p-4 flex gap-4 bg-surface">
                    <img src={property.image} alt={property.name} className="w-24 h-24 rounded-2xl object-cover bg-beige" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-foreground text-lg truncate">{property.name}</h4>
                          <p className="text-sm text-muted">{property.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">${property.price}</p>
                          <p className="text-xs text-muted">{property.active ? 'Visible' : 'Oculta'}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                        {property.smoobuApartmentId && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">ID Smoobu {property.smoobuApartmentId}</span>}
                        {property.featured && <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">Destacada</span>}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => handleEdit(property)} className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:border-primary transition-colors flex items-center gap-2"><Pencil className="w-4 h-4" /> Editar</button>
                        <button onClick={() => handleDelete(property.id)} className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:border-red-400 transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4" /> Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, icon, onChange, value = '', ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          {...props}
          value={value ?? ''}
          onChange={(event) => onChange?.(event.target.value)}
          className={`w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary ${icon ? 'pl-11' : ''}`}
        />
      </div>
    </div>
  )
}

function TextArea({ label, onChange, value = '', ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{label}</label>
      <textarea
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary resize-y"
      />
    </div>
  )
}

export default AdminPage
