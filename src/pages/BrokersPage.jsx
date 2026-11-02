import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Link2, Share2, Wallet } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/config'
import { useI18n } from '../lib/i18n'
import { BROKERS_I18N } from '../i18n/legal'

const ES = {
  badge: 'Programa de brokers',
  title: ['Reserva para tus clientes.', 'Gana 10%.'],
  intro: 'Sin cotizaciones ni negociar comisiones: compartes tu enlace, tu cliente reserva con el precio más bajo garantizado y tú recibes tu comisión.',
  steps: [
    ['Recibes tu enlace', 'Te damos un enlace personal de nuestra página. Es tuyo y no cambia.'],
    ['Lo compartes o reservas tú', 'Mándaselo a tus clientes, o entra tú mismo con tu enlace y reserva para ellos. Los precios y la disponibilidad son los de la página, en tiempo real.'],
    ['Cobras tu comisión', 'Cada reserva hecha desde tu enlace queda registrada a tu nombre. Te pagamos el 10% de comisión después del check-out del huésped.']
  ],
  termsTitle: 'Condiciones',
  terms: [
    'La comisión es del 10% sobre la tarifa de hospedaje de la reserva, después de descuentos y sin incluir limpieza ni IVA.',
    'Se paga una vez que el huésped completa su estancia. Las reservas canceladas no generan comisión.',
    'Aplica a reservas pagadas en línea desde tu enlace personal.'
  ],
  cta: 'Pedir mi enlace por WhatsApp',
  wa: 'Hola, quiero ser broker de AR Vacaciones y recibir mi enlace'
}
const icons = [Link2, Share2, Wallet]

function BrokersPage() {
  const { t, lang } = useI18n()
  const c = lang !== 'es' && BROKERS_I18N[lang] ? BROKERS_I18N[lang] : ES

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <main className="min-h-screen bg-beige pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('Volver al inicio')}
        </Link>

        <span className="text-primary font-semibold tracking-wide uppercase text-sm">{c.badge}</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
          {c.title[0]} <span className="text-primary">{c.title[1]}</span>
        </h1>
        <p className="text-muted text-lg leading-relaxed mb-10">{c.intro}</p>

        <div className="space-y-4 mb-10">
          {c.steps.map(([title, text], i) => {
            const Icon = icons[i]
            return (
              <div key={title} className="bg-white rounded-2xl p-5 flex gap-4 shadow-sm">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{i + 1}. {title}</h2>
                  <p className="text-muted text-sm leading-relaxed mt-1">{text}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 text-sm text-muted space-y-2">
          <h2 className="font-semibold text-foreground text-base">{c.termsTitle}</h2>
          {c.terms.map((line) => <p key={line}>{line}</p>)}
        </div>

        <a
          href={buildWhatsAppLink(c.wa)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-semibold"
        >
          {c.cta}
        </a>
      </div>
    </main>
  )
}

export default BrokersPage
