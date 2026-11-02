import React, { useEffect, useRef, useState } from 'react'
import { X, Upload, Trash2, ArrowLeft, ArrowRight, Star, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

// Shrinks a photo in the browser (max 1600 px, JPEG) so uploads are fast and the site stays light
const shrink = (file) => new Promise((resolve, reject) => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    resolve(canvas.toDataURL('image/jpeg', 0.82))
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`No se pudo leer ${file.name}. Usa fotos JPG o PNG.`)) }
  img.src = url
})

const Field = ({ label, hint, children }) => (
  <label className="block text-sm">
    <span className="block font-medium text-foreground mb-1">{label}</span>
    {children}
    {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
  </label>
)

const inputCls = 'w-full border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-primary'

// Admin: edit one property — photos (upload, cover, order, remove), text, cleaning fee, visibility
function PropertyEditor({ id, token, onClose, onSaved }) {
  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    let alive = true
    api.getAdminProperty(id, token)
      .then((p) => {
        if (!alive) return
        setData(p)
        setPhotos(p.photos || [])
        setForm({ name: p.name, summary: p.summary, amenities: (p.amenities || []).join(', '), cleaningFee: p.cleaningFee, hidden: p.hidden })
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [id, token])

  const move = (i, d) => {
    const next = [...photos]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setPhotos(next)
  }
  const makeCover = (i) => setPhotos([photos[i], ...photos.filter((_, k) => k !== i)])
  const remove = (i) => setPhotos(photos.filter((_, k) => k !== i))

  const upload = async (files) => {
    setError('')
    setNotice('')
    let current = photos
    try {
      for (let n = 0; n < files.length; n++) {
        setUploading(`Subiendo foto ${n + 1} de ${files.length}…`)
        const dataUrl = await shrink(files[n])
        const r = await api.uploadPropertyPhoto(id, { name: files[n].name, data: dataUrl }, token)
        current = r.photos
        setPhotos(r.photos)
      }
      setNotice(`${files.length} foto${files.length > 1 ? 's' : ''} agregada${files.length > 1 ? 's' : ''} al final y ya publicada${files.length > 1 ? 's' : ''}. Ordénalas si quieres y pulsa Guardar.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const save = async () => {
    try {
      setSaving(true)
      setError('')
      setNotice('')
      await api.saveAdminProperty(id, {
        name: form.name,
        summary: form.summary,
        amenities: form.amenities.split(',').map((x) => x.trim()).filter(Boolean),
        cleaningFee: form.cleaningFee,
        hidden: form.hidden,
        photos
      }, token)
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-start md:items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white md:rounded-3xl shadow-2xl max-h-screen md:max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Editar: {data?.smoobuName || '…'}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-beige flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>

        {loading && <p className="p-8 text-muted">Cargando…</p>}

        {form && (
          <div className="p-5 md:p-6 space-y-7">
            {!data.storeReady && (
              <div className="rounded-xl bg-amber-50 text-amber-800 text-sm px-4 py-3">
                Para guardar cambios y subir fotos falta conectar el guardado (variable <strong>GITHUB_TOKEN</strong> en Render). Mientras tanto puedes ver todo, pero no se guardará.
              </div>
            )}
            {error && <div className="rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3">{error}</div>}
            {notice && <div className="rounded-xl bg-green-50 text-green-700 text-sm px-4 py-3">{notice}</div>}

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">Fotos ({photos.length})</h3>
                  <p className="text-xs text-muted">La primera es la portada. Usa las flechas para ordenar o la estrella para poner otra de portada.</p>
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files?.length && upload([...e.target.files])} />
                  <button
                    type="button"
                    disabled={Boolean(uploading)}
                    onClick={() => fileRef.current?.click()}
                    className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploading || 'Subir fotos'}
                  </button>
                </div>
              </div>

              {photos.length === 0 ? (
                <p className="text-sm text-muted">Esta propiedad todavía no tiene fotos propias.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {photos.map((src, i) => (
                    <div key={src} className="rounded-xl border border-border overflow-hidden bg-beige">
                      <div className="relative aspect-[4/3]">
                        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute top-2 left-2 bg-primary text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">Portada</span>}
                      </div>
                      <div className="flex items-center justify-between px-1.5 py-1.5 bg-white">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Mover antes" className="p-1.5 rounded-lg hover:bg-beige disabled:opacity-30"><ArrowLeft className="w-4 h-4" /></button>
                        <button type="button" onClick={() => makeCover(i)} disabled={i === 0} title="Poner de portada" className="p-1.5 rounded-lg hover:bg-beige disabled:opacity-30"><Star className="w-4 h-4" /></button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} title="Mover después" className="p-1.5 rounded-lg hover:bg-beige disabled:opacity-30"><ArrowRight className="w-4 h-4" /></button>
                        <button type="button" onClick={() => remove(i)} title="Quitar" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid md:grid-cols-2 gap-4">
              <Field label="Nombre en la web" hint={`En Smoobu se llama: ${data.smoobuName}`}>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Tarifa de limpieza (USD)" hint="Se cobra una vez por estancia, antes del IVA.">
                <input className={inputCls} type="number" min="0" value={form.cleaningFee} onChange={(e) => setForm({ ...form, cleaningFee: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Descripción">
                  <textarea className={inputCls} rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Amenidades" hint="Sepáralas con comas. Ej.: Alberca, WiFi, Aire acondicionado, Gimnasio">
                  <input className={inputCls} value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
                </Field>
              </div>
              <label className="md:col-span-2 flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.hidden} onChange={(e) => setForm({ ...form, hidden: e.target.checked })} className="w-4 h-4" />
                <span><strong>Ocultar esta propiedad</strong> de la página (no aparece ni se puede reservar)</span>
              </label>
            </section>

            <p className="text-xs text-muted">El precio por noche, la estancia mínima y la disponibilidad no se editan aquí: se cambian en Smoobu.</p>
          </div>
        )}

        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm hover:border-primary">Cancelar</button>
          <button onClick={save} disabled={saving || !form || Boolean(uploading)} className="rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-6 py-2.5 text-sm font-medium">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PropertyEditor
