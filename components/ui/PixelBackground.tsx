'use client'

import { useEffect, useRef } from 'react'

export default function PixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createHalftonePattern = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const dotSpacing = 8
      const maxDotSize = 4
      
      // Create multiple wave centers for organic shapes
      const centers = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, intensity: 0.8 },
        { x: canvas.width * 0.7, y: canvas.height * 0.6, intensity: 0.9 },
        { x: canvas.width * 0.4, y: canvas.height * 0.8, intensity: 0.7 },
        { x: canvas.width * 0.8, y: canvas.height * 0.2, intensity: 0.6 }
      ]
      
      for (let x = 0; x < canvas.width; x += dotSpacing) {
        for (let y = 0; y < canvas.height; y += dotSpacing) {
          let intensity = 0
          
          // Calculate intensity based on distance from wave centers
          centers.forEach(center => {
            const distance = Math.sqrt(
              Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
            )
            const wave = Math.sin(distance * 0.01 + time * 0.001) * 0.5 + 0.5
            const falloff = Math.exp(-distance * 0.002)
            intensity += center.intensity * wave * falloff
          })
          
          // Add some noise for organic feel
          const noise = Math.sin(x * 0.02 + time * 0.0005) * Math.cos(y * 0.02 + time * 0.0007) * 0.3
          intensity += noise
          
          // Clamp intensity
          intensity = Math.max(0, Math.min(1, intensity))
          
          if (intensity > 0.1) {
            const dotSize = intensity * maxDotSize
            const alpha = intensity * 0.8
            
            // Purple/blue color matching the reference
            ctx.fillStyle = `rgba(177, 158, 239, ${alpha})`
            ctx.beginPath()
            ctx.arc(x, y, dotSize, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    const animate = (time: number) => {
      createHalftonePattern(time)
      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate(0)

    const handleResize = () => {
      resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ 
        zIndex: 1,
        pointerEvents: 'none'
      }}
    />
  )
}