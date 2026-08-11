import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { vertexShader, fragmentShader } from './shaders'
import './Loader.css'

interface LoaderProps {
  onRevealed?: () => void
  armDelay?: number
}

function Loader({ onRevealed, armDelay = 0 }: LoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [armed, setArmed] = useState(() => armDelay === 0)

  const onRevealedRef = useRef(onRevealed)
  useEffect(() => {
    onRevealedRef.current = onRevealed
  }, [onRevealed])

  useEffect(() => {
    if (armDelay <= 0) return
    const id = window.setTimeout(() => setArmed(true), armDelay)
    return () => window.clearTimeout(id)
  }, [armDelay])

  const uniformsRef = useRef<{
    uTransition: { value: number }
    uResolution: { value: THREE.Vector2 }
    uTime: { value: number }
    uBorderColor: { value: THREE.Color }
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const uniforms = {
      uTransition: { value: 0.0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTime: { value: 0.0 },
      uBorderColor: { value: new THREE.Color('blue') },
    }

    uniformsRef.current = uniforms

    const geometry = new THREE.PlaneGeometry(2, 2)

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      uniforms.uResolution.value.set(width, height)
    }

    window.addEventListener('resize', handleResize)

    const clock = new THREE.Clock()

    let animationId: number

    const tick = () => {
      const elapsedTime = clock.getElapsedTime()
      uniforms.uTime.value = elapsedTime

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)

      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  const startedRef = useRef(false)

  useEffect(() => {
    if (!armed || !uniformsRef.current || startedRef.current) return
    startedRef.current = true

    const uniforms = uniformsRef.current
    const tweens: gsap.core.Tween[] = []

    tweens.push(
      gsap.to(uniforms.uBorderColor.value, {
        r: 1,
        g: 1,
        b: 1,
        delay: 0.5,
        duration: 3.0,
        ease: 'power2.inOut',
      }),
    )

    tweens.push(
      gsap.to(uniforms.uTransition, {
        value: 1.0,
        delay: 0.5,
        duration: 3.0,
        ease: 'power2.inOut',
        onComplete: () => {
          onRevealedRef.current?.()
        },
      }),
    )

    return () => {
      tweens.forEach((t) => t.kill())
      startedRef.current = false
    }
  }, [armed])

  return (
    <div
      id="loader"
      style={{ opacity: armed ? 1 : 0, pointerEvents: 'none' }}
    >
      <canvas ref={canvasRef} id="loader-canvas"></canvas>
    </div>
  )
}

export default Loader
