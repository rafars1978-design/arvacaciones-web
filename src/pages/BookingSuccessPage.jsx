import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Home, MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/config'

function BookingSuccessPage() {
  const [params, setParams] = useState({})

  useEffect(() => {
    // Parse hash-based query params: /#/booking/success?session_id=xxx
    const search = window.location.hash.split('?')[1] || ''
    const p = Object.fromEntries(new URLSearchParams(search))
    setParams(p)
  }, [])

  const isMock = params.mock === '1'

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          ¡Reserva Confirmada!
        </h1>

        {isMock ? (
          <p className="text-muted mb-4">
            Esta es una reserva de prueba (modo demo). En producción, aquí recibirías la confirmación real con los detalles de tu estancia.
          </p>
        ) : (
          <p className="text-muted mb-4">
            Tu pago fue procesado exitosamente. En unos minutos recibirás un correo de confirmación con todos los detalles de tu reserva.
          </p>
        )}

        {params.property && (
          <div className="bg-beige rounded-2xl px-4 py-3 mb-6 text-sm text-foreground/80 space-y-1">
            <p><strong>Propiedad:</strong> {decodeURIComponent(params.property)}</p>
            {params.arrival && <p><strong>Llegada:</strong> {params.arrival}</p>}
            {params.departure && <p><strong>Salida:</strong> {params.departure}</p>}
            {params.email && <p><strong>Email:</strong> {decodeURIComponent(params.email)}</p>}
          </div>
        )}

        {!isMock && params.session_id && (
          <p className="text-xs text-muted mb-6">
            Referencia: <span className="font-mono">{params.session_id.slice(-12)}</span>
          </p>
        )}

        <div className="space-y-3">
          <a
            href="/#/"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all"
          >
            <Home className="w-5 h-5" />
            Volver al inicio
          </a>

          <a
            href={buildWhatsAppLink('Hola, acabo de realizar una reserva en AR Vacaciones y tengo una pregunta.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border-2 border-green-500 hover:bg-green-50 text-green-600 font-semibold py-3 rounded-xl transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Contactar por WhatsApp
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingSuccessPage
