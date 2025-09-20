'use client'
import { useEffect, useRef } from 'react'

interface SplashCursorProps {
  size?: number
  color1?: string
  color2?: string
  color3?: string
}

function SplashCursor({
  size = 20,
  color1 = '#FFD700', // Gold
  color2 = '#FF69B4', // Pink
  color3 = '#87CEFA', // Light Blue
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Mouse position tracking
    let mouseX = 0
    let mouseY = 0
    let lastX = 0
    let lastY = 0
    let mouseMoved = false

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      mouseMoved = true
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Particle system
    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      life: number
      maxLife: number
      color: string
    }[] = []

    // Create splash effect
    const createSplash = (x: number, y: number) => {
      const particleCount = 8 + Math.floor(Math.random() * 5)
      const colors = [color1, color2, color3]

      for (let i = 0; i < particleCount; i++) {
        if (particles.length > 100) break

        const angle = Math.random() * Math.PI * 2
        const speed = 1 + Math.random() * 2
        const particleSize = 2 + Math.random() * 4
        const life = 20 + Math.floor(Math.random() * 20)
        const color = colors[Math.floor(Math.random() * colors.length)]

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: particleSize,
          life,
          maxLife: life,
          color,
        })
      }
    }

    // Animation loop
    let animationId: number
    let time = 0

    const render = () => {
      if (!ctx) return

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time += 0.016

      // Create splash when mouse moves quickly
      if (mouseMoved) {
        const dx = mouseX - lastX
        const dy = mouseY - lastY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 5) {
          createSplash(mouseX, mouseY)
        }

        lastX = mouseX
        lastY = mouseY
        mouseMoved = false
      }

      // Update and render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        // Update particle
        p.x += p.vx
        p.y += p.vy
        p.life--

        // Apply gravity
        p.vy += 0.05

        // Remove dead particles
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        // Render particle
        const alpha = p.life / p.maxLife
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw main cursor circle
      ctx.globalAlpha = 0.7
      ctx.fillStyle = color1
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, size * 0.5, 0, Math.PI * 2)
      ctx.fill()

      // Draw outer glow
      ctx.globalAlpha = 0.3
      ctx.fillStyle = color2
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, size, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = 1.0

      animationId = requestAnimationFrame(render)
    }

    render()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [size, color1, color2, color3])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  )
}

export { SplashCursor }
