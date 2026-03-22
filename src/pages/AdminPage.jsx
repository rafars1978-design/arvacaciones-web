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
    const [credentials, setCredentials] = useState({ email: '', password: '' })
    const [loginMsg, setLoginMsg] = useState('')
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
                setLoginMsg('Conectando con el servidor… Si es la primera vez del día puede tardar hasta 60 segundos.')
                const response = await api.login(credentials)
                auth.setToken(response.token)
                setToken(response.token)
                setLoginMsg('')
                setMessage('Acceso correcto al panel administrador.')
        } catch (err) {
                setLoginMsg('')
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
                <section className=
