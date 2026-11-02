import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { buildWhatsAppLink } from '../lib/config'

const UPDATED = '2 de noviembre de 2026'

const PAGES = {
  terminos: {
    title: 'Términos y Condiciones',
    sections: [
      ['Quiénes somos', ['AR Vacaciones administra departamentos y estudios vacacionales en Playa del Carmen, Tulum y Mahahual, Quintana Roo, México. Al reservar en este sitio aceptas estos términos.']],
      ['Reservas', [
        'La disponibilidad y los precios que ves en el sitio se consultan en tiempo real. Tu reserva queda confirmada cuando el pago se completa; te enviamos la confirmación por correo electrónico.',
        'Eres responsable de que los datos que nos proporcionas (nombre, correo, teléfono, fechas y número de huéspedes) sean correctos.'
      ]],
      ['Precios, impuestos y moneda', [
        'La tarifa por noche varía según la temporada y la propiedad. La estancia mínima también puede cambiar según las fechas; el sitio te la indica antes de reservar.',
        'El total incluye el hospedaje, una tarifa de limpieza única por estancia y el IVA del 16%, desglosados antes del pago.',
        'Las tarifas se expresan en dólares estadounidenses (USD). El cobro se realiza en pesos mexicanos (MXN) al tipo de cambio del día, que te mostramos antes de pagar. Tu banco puede aplicar comisiones propias.'
      ]],
      ['Descuentos por estancia', ['Al reservar directamente en este sitio aplicamos 10% de descuento sobre la tarifa de hospedaje en estancias de 7 noches o más, y 20% en estancias de 30 noches o más. Los descuentos no aplican si alguna noche de la estancia cae entre el 15 de diciembre y el 30 de marzo, ni a la tarifa de limpieza.']],
      ['Pago', ['Los pagos se procesan en línea a través de Clip. AR Vacaciones no almacena ni tiene acceso a los datos completos de tu tarjeta.']],
      ['Huéspedes y uso de la propiedad', [
        'Cada propiedad tiene una capacidad máxima de huéspedes que no debe excederse.',
        'Debes respetar el reglamento del edificio o condominio, las áreas comunes y a los vecinos. Eres responsable de los daños causados a la propiedad o a sus áreas comunes durante tu estancia.',
        'Las instrucciones de llegada y salida te llegan antes de tu estancia.'
      ]],
      ['Cancelaciones y cambios', ['Todas las reservas se hacen con tarifa no reembolsable. Consulta nuestra Política de Cancelación.']],
      ['Responsabilidad', ['Nos esforzamos por que la información del sitio (fotos, descripciones, amenidades) sea exacta. No somos responsables por eventos fuera de nuestro control, como fenómenos naturales, cortes de servicios públicos o del edificio, ni por objetos olvidados o perdidos.']],
      ['Ley aplicable', ['Estos términos se rigen por las leyes aplicables en los Estados Unidos Mexicanos.']],
      ['Contacto', ['Para cualquier duda escríbenos por WhatsApp o llámanos al +52 984 310 0691.']]
    ]
  },
  privacidad: {
    title: 'Aviso de Privacidad',
    sections: [
      ['Responsable', ['AR Vacaciones, con domicilio de operación en Playa del Carmen, Quintana Roo, México, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.']],
      ['Qué datos recabamos', ['Nombre y apellido, correo electrónico, teléfono, fechas de estancia, número de huéspedes y los mensajes que nos envías por el formulario de contacto o por WhatsApp. Los datos de tu tarjeta los captura directamente Clip; nosotros no los recibimos ni los guardamos.']],
      ['Para qué los usamos', ['Para gestionar y confirmar tu reserva, procesar tu pago, enviarte las instrucciones de llegada, atender tus dudas y cumplir obligaciones legales. No vendemos tus datos.']],
      ['Con quién los compartimos', ['Únicamente con los proveedores necesarios para prestarte el servicio: el procesador de pagos (Clip), nuestro sistema de administración de reservas y, en su caso, el personal que prepara y recibe tu estancia. También con autoridades cuando la ley lo exija.']],
      ['Tus derechos', ['Puedes acceder, rectificar o cancelar tus datos, oponerte a su uso o revocar tu consentimiento (derechos ARCO). Escríbenos por WhatsApp al +52 984 310 0691 indicando tu nombre y el correo con el que reservaste.']],
      ['Cambios a este aviso', [`Si lo actualizamos, publicaremos la nueva versión en esta página. Última actualización: ${UPDATED}.`]]
    ]
  },
  cancelacion: {
    title: 'Política de Cancelación',
    sections: [
      ['Tarifa no reembolsable', [
        'Todas las reservas hechas en este sitio se realizan con tarifa no reembolsable. Una vez confirmado el pago, no se hacen reembolsos por cancelación, salida anticipada o no presentación.',
        'Antes de pagar, revisa con cuidado las fechas, la propiedad y el número de huéspedes.'
      ]],
      ['Cambios de fechas', ['Si necesitas modificar tu reserva, escríbenos por WhatsApp al +52 984 310 0691 con tu nombre y la referencia de tu reserva (comienza con ARV-). Cualquier cambio queda sujeto a disponibilidad y a nuestra aprobación.']],
      ['Casos especiales', ['Si por causa nuestra no podemos darte el alojamiento reservado, te ofreceremos una alternativa equivalente o la devolución de lo pagado.']]
    ]
  },
  'aviso-legal': {
    title: 'Aviso Legal',
    sections: [
      ['Titular del sitio', ['Este sitio, www.arvacaciones.site, es operado por AR Vacaciones, Playa del Carmen, Quintana Roo, México. Contacto: +52 984 310 0691.']],
      ['Contenido', ['Las fotografías, textos y diseño del sitio pertenecen a AR Vacaciones o se usan con autorización. No pueden copiarse ni reutilizarse sin permiso.']],
      ['Exactitud de la información', ['Procuramos que los precios, la disponibilidad y las descripciones sean correctos y se actualicen en tiempo real, pero pueden existir errores. La confirmación final es la que recibes por correo al completar tu reserva.']],
      ['Enlaces externos', ['El sitio puede enlazar a páginas de terceros (como Airbnb, Booking.com o Clip). No controlamos su contenido ni sus políticas.']]
    ]
  }
}

function LegalPage({ page }) {
  const data = PAGES[page]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  if (!data) return null

  return (
    <main className="min-h-screen bg-beige pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
        <article className="bg-white rounded-3xl shadow-sm p-6 md:p-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">{data.title}</h1>
          <p className="text-sm text-muted mb-8">Última actualización: {UPDATED}</p>

          {data.sections.map(([heading, paragraphs]) => (
            <section key={heading} className="mb-7">
              <h2 className="font-semibold text-lg text-foreground mb-2">{heading}</h2>
              {paragraphs.map((text) => (
                <p key={text} className="text-muted leading-relaxed mb-3">{text}</p>
              ))}
            </section>
          ))}

          <a
            href={buildWhatsAppLink('Hola, tengo una duda sobre mi reserva con AR Vacaciones')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium text-sm"
          >
            Escríbenos por WhatsApp
          </a>
        </article>
      </div>
    </main>
  )
}

export default LegalPage
