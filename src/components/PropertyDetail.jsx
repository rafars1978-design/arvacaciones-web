import React, { useEffect, useState } from 'react'
import { X, MapPin, Users, Bed, Bath, Moon, Sparkles } from 'lucide-react'
import PropertyCarousel, { getImages } from './PropertyCarousel'
import { localizedSummary } from '../lib/property'
import { useI18n } from '../lib/i18n'

const money = (n) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

// Full gallery + details for one property, opened by clicking its card
function PropertyDetail({ property, onClose, onReserve }) {
  const { t } = useI18n()
  const images = getImages(property)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [images.length, onClose])

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white md:rounded-3xl shadow-2xl overflow-hidden max-h-screen md:max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Cerrar')}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <PropertyCarousel
          images={images}
          alt={property.name}
          index={index}
          onIndexChange={setIndex}
          showCounter
          className="h-72 md:h-[28rem] bg-black"
          imgClassName="object-cover"
        />

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 md:px-6 py-3 bg-beige">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('Ver foto {n}', { n: i + 1 })}
                className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 md:p-8 grid md:grid-cols-[1fr_20rem] gap-8">
          <div>
            <div className="flex items-center gap-1 text-muted text-sm mb-2">
              <MapPin className="w-4 h-4" /> {property.location}
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">{property.name}</h2>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/80 mb-5">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {property.guests} {t('huéspedes')}</span>
              <span className="flex items-center gap-1.5"><Bed className="w-4 h-4" /> {property.bedrooms} {property.bedrooms === 1 ? t('recámara') : t('recámaras')}</span>
              <span className="flex items-center gap-1.5"><Bath className="w-4 h-4" /> {property.bathrooms} {property.bathrooms === 1 ? t('baño') : t('baños')}</span>
              {property.minNights > 1 && (
                <span className="flex items-center gap-1.5"><Moon className="w-4 h-4" /> {t('Mínimo {n} noches', { n: property.minNights })}</span>
              )}
            </div>

            <p className="text-muted leading-relaxed mb-5">{localizedSummary(property, t)}</p>

            {(property.amenities || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span key={a} className="px-3 py-1 bg-beige rounded-full text-xs font-medium text-muted">{t(a)}</span>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-border p-5 h-fit md:sticky md:top-0">
            {property.price > 0 && (
              <>
                <p className="text-sm text-muted">{t('Desde')}</p>
                <p className="text-3xl font-bold text-foreground">
                  {money(property.price)} <span className="text-sm font-normal text-muted">{property.currency}{t(' / noche')}</span>
                </p>
                <ul className="text-xs text-muted mt-3 space-y-1">
                  <li>{t('+ IVA 16%')}</li>
                  {property.cleaningFee > 0 && <li>{t('+ Limpieza {fee} {cur} (una vez)', { fee: money(property.cleaningFee), cur: property.currency })}</li>}
                  {property.minNights > 1 && <li>{t('Estancia mínima desde {n} noches (varía por temporada)', { n: property.minNights })}</li>}
                </ul>
              </>
            )}
            <p className="mt-4 text-xs text-primary font-medium">{t('Precio más bajo garantizado reservando en nuestra página.')}</p>
            <p className="mt-1 text-xs text-muted">{t('10% de descuento en estancias de 7 noches o más y 20% en estancias de 30 noches o más. No aplica del 15 de diciembre al 30 de marzo.')}</p>
            <button
              type="button"
              onClick={() => onReserve(property)}
              className="w-full mt-5 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" /> {t('Reservar')}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetail
