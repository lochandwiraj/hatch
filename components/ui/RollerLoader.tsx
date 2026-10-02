'use client'

/**
 * The inline wait indicator.
 *
 * This component previously rendered eight empty divs against a `.lds-roller`
 * class that is not defined anywhere in the codebase, so it has been drawing
 * nothing. Rebuilt self-contained: the styles travel with the component and
 * cannot go missing again.
 *
 * Squares, not dots, because nothing in this system has a radius. Eight marks
 * on a ring, each fading in turn, which reads as mechanical rather than cute.
 * It stops entirely under prefers-reduced-motion.
 */
export default function RollerLoader({ size = 32 }: { size?: number }) {
  const marks = Array.from({ length: 8 })
  return (
    <span
      role="status"
      aria-label="Loading"
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {marks.map((_, i) => (
        <span
          key={i}
          className="absolute bg-signal motion-reduce:animate-none"
          style={{
            width: Math.max(2, size / 10),
            height: Math.max(2, size / 10),
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 45}deg) translateY(-${size / 2.6}px)`,
            transformOrigin: '0 0',
            animation: `roller-fade 1s linear ${i * 0.125}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes roller-fade {
          0%   { opacity: 1 }
          70%  { opacity: .15 }
          100% { opacity: .15 }
        }
      `}</style>
    </span>
  )
}
