'use client'

/**
 * A determinate-feeling wait for buttons and small inline slots.
 *
 * Same story as RollerLoader: the original referenced `.loader`, `.circle`,
 * `.dot` and `.outline` classes that are defined nowhere, so it rendered
 * nothing. Rebuilt self-contained, and square, because this system has no
 * radius anywhere.
 */
export default function CircleLoader({ size = 20 }: { size?: number }) {
  const bar = Math.max(2, Math.round(size / 8))
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-flex items-end gap-px"
      style={{ height: size }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="bg-signal motion-reduce:animate-none"
          style={{
            width: bar,
            height: size,
            animation: `bar-step .9s steps(4) ${i * 0.1}s infinite`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
      <style>{`
        @keyframes bar-step {
          0%, 100% { transform: scaleY(.3) }
          50%      { transform: scaleY(1) }
        }
      `}</style>
    </span>
  )
}
