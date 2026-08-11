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
  const clickPromptRef = useRef<HTMLParagraphElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [armed, setArmed] = useState(() => armDelay === 0)
  const armedRef = useRef(armed)

  useEffect(() => {
    armedRef.current = armed
  }, [armed])

  useEffect(() => {
    if (armDelay <= 0) return
    const id = window.setTimeout(() => setArmed(true), armDelay)
    return () => window.clearTimeout(id)
  }, [armDelay])

  useEffect(() => {
    if (!armed || !clickPromptRef.current) return
    gsap.to(clickPromptRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  }, [armed])

  const onRevealedRef = useRef(onRevealed)
  useEffect(() => {
    onRevealedRef.current = onRevealed
  }, [onRevealed])

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

    let isRevealed = false

    const handleClick = () => {
      if (!armedRef.current || isRevealed) return
      isRevealed = true

      if (clickPromptRef.current) {
        gsap.to(clickPromptRef.current, {
          opacity: 0,
          y: -25,
          duration: 0.5,
          ease: 'power2.inOut',
        })
      }

      gsap.to(uniforms.uBorderColor.value, {
        r: 1,
        g: 1,
        b: 1,
        duration: 3.0,
        ease: 'power2.inOut',
      })

      gsap.to(uniforms.uTransition, {
        value: 1.0,
        duration: 3.0,
        ease: 'power2.inOut',
        onComplete: () => {
          setRevealed(true)
          onRevealedRef.current?.()
        },
      })
    }

    window.addEventListener('click', handleClick)

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
      window.removeEventListener('click', handleClick)

      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      id="loader"
      style={{
        opacity: armed ? 1 : 0,
        pointerEvents: armed && !revealed ? 'all' : 'none',
      }}
    >
      <canvas ref={canvasRef} id="loader-canvas"></canvas>
      <p ref={clickPromptRef} className="click-prompt" style={{ opacity: 0 }}>
        CLICK TO REVEAL
      </p>
    </div>
  )
}

export default Loader
