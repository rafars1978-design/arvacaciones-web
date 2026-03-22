import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Send, MapPin, Phone, Clock, CheckCircle } from 'lucide-react'
import { api } from '../lib/api'
import { buildWhatsAppLink } from '../lib/config'

function ContactForm() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    checkin: '',
    checkout: '',
    guests: '2',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      await api.submitContact(formData)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError(err.message)
      const whatsappMessage = `Hola! Me gustaría hacer una reserva:

Nombre: ${formData.name}
Teléfono: ${formData.phone}
Check-in: ${formData.checkin}
Check-out: ${formData.checkout}
Huéspedes: ${formData.guests}
Mensaje: ${formData.message}`
      window.open(buildWhatsAppLink(whatsappMessage), '_blank')
    }
  }

  return (
    <section id="contact" ref={ref} className="py-24 md:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="inline-block text-primary font-semibold tracking-wide uppercase text-sm mb-4">
              Reservaciones
            </motion.span>
            <motion.h2 initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Haz tu <span className="text-primary">Reserva</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="text-muted text-lg mb-10">
              El diseño sigue igual, pero ahora el formulario puede vivir conectado a backend y CRM. Si el API falla, el sitio todavía te envía el lead por WhatsApp.
            </motion.p>

            <motion.form initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Nombre completo *" name="name" value={formData.name} onChange={handleChange} placeholder="Tu nombre" required />
                <Input label="Teléfono / WhatsApp *" name="phone" value={formData.phone} onChange={handleChange} placeholder="+52 (123) 456-7890" required />
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <Input label="Check-in *" name="checkin" type="date" value={formData.checkin} onChange={handleChange} required />
                <Input label="Check-out *" name="checkout" type="date" value={formData.checkout} onChange={handleChange} required />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Huéspedes</label>
                  <select name="guests" value={formData.guests} onChange={handleChange} className="w-full bg-beige border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'huésped' : 'huéspedes'}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mensaje adicional</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows={4} className="w-full bg-beige border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="¿Alguna solicitud especial? ¿Buscas una propiedad en específico?" />
              </div>
              {error && <div className="rounded-xl bg-amber-50 text-amber-700 px-4 py-3 text-sm">{error}. Abriremos respaldo por WhatsApp si lo necesitas.</div>}
              <motion.button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                {submitted ? <><CheckCircle className="w-5 h-5" /> ¡Enviado con éxito!</> : <><Send className="w-5 h-5" /> Enviar Solicitud</>}
              </motion.button>
            </motion.form>
          </div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.3 }} className="space-y-8">
            <div className="rounded-2xl overflow-hidden h-64 md:h-80">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119748.97953289573!2d-87.13876847812499!3d20.62920559999999!2m3!1f0!2f0!3f0!2m3!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f4e4323d22d4e0f%3A0xa5fb4b1e68e1b785!2sPlaya%20del%20Carmen%2C%20Q.R.%2C%20Mexico!5e0!3m2!1sen!2sus!4v1702320000000!5m2!1sen!2sus" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoCard icon={<MapPin className="w-6 h-6 text-primary" />} title="Ubicación">Playa del Carmen<br />Quintana Roo, México</InfoCard>
              <InfoCard icon={<Phone className="w-6 h-6 text-primary" />} title="Teléfono"><a href="tel:+529831304797" className="hover:text-primary transition-colors">+52 983 130 4797</a></InfoCard>
              <InfoCard icon={<Clock className="w-6 h-6 text-primary" />} title="Tiempo de respuesta">Menos de 2 horas<br />por WhatsApp o formulario</InfoCard>
              <InfoCard icon={<CheckCircle className="w-6 h-6 text-primary" />} title="Integración lista">Preparado para disponibilidad y precios con Smoobu</InfoCard>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <input {...props} className="w-full bg-beige border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
    </div>
  )
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="bg-beige rounded-2xl p-6">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">{icon}</div>
      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <div className="text-muted text-sm">{children}</div>
    </div>
  )
}

export default ContactForm
