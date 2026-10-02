'use client'

/**
 * The full-page wait. Rebuilt self-contained for the same reason as the other
 * two: its original class names were never defined.
 *
 * A radial set of 1px rules sweeping once, which matches the hairline language
 * of the rest of the system rather than introducing a new shape vocabulary.
 */
export default function FlowerLoader({ size = 48 }: { size?: number }) {
  const spokes = Array.from({ length: 12 })
  return (
    <span
      role="status"
      aria-label="Loading"
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {spokes.map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 bg-type-secondary motion-reduce:animate-none"
          style={{
            width: 1,
            height: size / 2.5,
            transform: `rotate(${i * 30}deg) translateY(-${size / 2.5}px)`,
            transformOrigin: '50% 100%',
            animation: `spoke-fade 1.2s linear ${i * 0.1}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes spoke-fade {
          0%   { opacity: 1 }
          60%  { opacity: .12 }
          100% { opacity: .12 }
        }
      `}</style>
    </span>
  )
}
