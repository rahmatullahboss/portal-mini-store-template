'use client'
import { useEffect, useRef } from 'react'

interface SplashCursorProps {
  SIM_RESOLUTION?: number
  DYE_RESOLUTION?: number
  CAPTURE_RESOLUTION?: number
  DENSITY_DISSIPATION?: number
  VELOCITY_DISSIPATION?: number
  PRESSURE?: number
  PRESSURE_ITERATIONS?: number
  CURL?: number
  SPLAT_RADIUS?: number
  SPLAT_FORCE?: number
  SHADING?: boolean
  COLOR_UPDATE_SPEED?: number
  BACK_COLOR?: { r: number; g: number; b: number }
  TRANSPARENT?: boolean
}

function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0.5, g: 0, b: 0 },
  TRANSPARENT = true,
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) {
      console.warn('WebGL not supported')
      return
    }

    // Simple WebGL rendering for splash effect
    let animationId: number
    let time = 0

    const render = () => {
      time += 0.01

      // Clear canvas
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      // Simple animation - in a real implementation, this would be much more complex
      // This is just a placeholder to show the component is working
      const colors = new Float32Array([
        Math.sin(time) * 0.5 + 0.5,
        Math.cos(time) * 0.5 + 0.5,
        0.5,
        1.0,
      ])

      gl.clearColor(colors[0], colors[1], colors[2], colors[3])
      gl.clear(gl.COLOR_BUFFER_BIT)

      animationId = requestAnimationFrame(render)
    }

    render()

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  )
}

export { SplashCursor }
