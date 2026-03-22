export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const WHATSAPP_NUMBER = '529831304797'

export const buildWhatsAppLink = (message) => {
  const text = encodeURIComponent(message || 'Hola, me interesa reservar una propiedad con AR Vacaciones')
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}
