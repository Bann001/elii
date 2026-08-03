import { useEffect } from 'react'

/**
 * Scroll-driven background: a road with a car whose position is bound to the
 * page scroll progress. It uses native CSS scroll-driven animations
 * (`animation-timeline: scroll()`) when available, and falls back to a
 * JS-updated `--sd-progress` custom property in browsers that don't support it.
 */
export default function RoadBackground() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const supportsScrollTimeline =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline', 'scroll()')

    // Native scroll-driven animations handle everything with no JS.
    if (supportsScrollTimeline) return

    const root = document.documentElement
    let raf = 0

    const update = () => {
      const max = root.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      root.style.setProperty(
        '--sd-progress',
        String(Math.max(0, Math.min(1, progress))),
      )
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="road" aria-hidden="true">
      <div className="road-surface" />
      <div className="road-lane" />
      <div className="road-car">
        <svg
          viewBox="0 0 40 64"
          width="40"
          height="64"
          role="presentation"
          focusable="false"
        >
          <defs>
            <linearGradient id="road-car-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#67e8f9" />
              <stop offset="0.55" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#0e7490" />
            </linearGradient>
          </defs>

          {/* wheels */}
          <rect x="2" y="13" width="6" height="12" rx="3" fill="#0f172a" />
          <rect x="32" y="13" width="6" height="12" rx="3" fill="#0f172a" />
          <rect x="2" y="39" width="6" height="12" rx="3" fill="#0f172a" />
          <rect x="32" y="39" width="6" height="12" rx="3" fill="#0f172a" />

          {/* body */}
          <rect
            x="7"
            y="3"
            width="26"
            height="58"
            rx="12"
            fill="url(#road-car-body)"
            stroke="#155e75"
            strokeWidth="1"
          />

          {/* windshield + cabin */}
          <path
            d="M12 22 Q20 16 28 22 L27 33 Q20 30 13 33 Z"
            fill="#0b1220"
            opacity="0.85"
          />
          <rect x="13" y="35" width="14" height="12" rx="4" fill="#0b1220" opacity="0.6" />

          {/* headlights (front = top) */}
          <rect x="11" y="5" width="6" height="3" rx="1.5" fill="#ecfeff" />
          <rect x="23" y="5" width="6" height="3" rx="1.5" fill="#ecfeff" />

          {/* taillights (rear = bottom) */}
          <rect x="11" y="57" width="5" height="2.5" rx="1.25" fill="#f87171" />
          <rect x="24" y="57" width="5" height="2.5" rx="1.25" fill="#f87171" />
        </svg>
      </div>
    </div>
  )
}
