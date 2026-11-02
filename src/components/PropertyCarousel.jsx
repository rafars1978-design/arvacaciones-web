import React, { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../lib/i18n'

const FALLBACK = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop'

export const getImages = (property) => {
  const all = [property.image, ...(property.gallery || [])].filter(Boolean)
  return all.length ? all : [FALLBACK]
}

// Image slider with arrows, dots and swipe. Clicks on the image bubble up to the parent.
function PropertyCarousel({ images, alt, index, onIndexChange, className = '', imgClassName = 'object-cover', showCounter = false }) {
  const { t } = useI18n()
  const [inner, setInner] = useState(0)
  const touchX = useRef(null)
  const controlled = typeof index === 'number'
  const current = controlled ? index : inner
  const setCurrent = (n) => (controlled ? onIndexChange?.(n) : setInner(n))
  const total = images.length

  const go = (delta) => (e) => {
    e.stopPropagation()
    setCurrent((current + delta + total) % total)
  }

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) > 40) {
      e.stopPropagation()
      setCurrent((current + (dx < 0 ? 1 : -1) + total) % total)
    }
  }

  return (
    <div className={`relative overflow-hidden group/carousel ${className}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={`${alt} - ${t('foto')} ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            draggable={false}
            className={`w-full h-full shrink-0 ${imgClassName}`}
            onError={(e) => { e.target.src = FALLBACK }}
          />
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label={t('Foto anterior')}
            onClick={go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center md:opacity-0 md:group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            type="button"
            aria-label={t('Foto siguiente')}
            onClick={go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center md:opacity-0 md:group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          {showCounter ? (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
              {current + 1} / {total}
            </div>
          ) : (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.slice(0, 9).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PropertyCarousel
