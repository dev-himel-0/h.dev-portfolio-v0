"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, type MotionValue } from "motion/react"

const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, [role='button']"
const COLOR = "#fff"
const RING_SIZE = 40
const RING_THICKNESS = 1
const DOT_SIZE = 8
const SMOOTHNESS = 5
const HOVER_SIZE = 72
const TRANSPARENT = "rgba(255, 255, 255, 0)"
const FOCUS_HALO_SIZE = 76
const FOCUS_HALO_COLOR = "rgba(255, 255, 255, 0.42)"
const POINTER_SIZE = 36
const SPARK_COUNT = 8
const SPARK_DURATION = 450
const SPARK_RADIUS = 24
const SPARK_LENGTH = 10
const SPARK_COLOR = "#fff"
const MAX_SPARKS = 64

/**
 * Window (ms) after real pointer activity within which focus events are
 * treated as mouse-driven. The focus halo only follows the focused element
 * for pure keyboard navigation — never when the mouse is engaged, so it can't
 * leave a stray circle on click-focused targets (like the menu's first link).
 */
const POINTER_ENGAGE_MS = 1200

const RING_TRANSITION = {
  opacity: { duration: 0.2 },
  width: { type: "spring" as const, damping: 30, stiffness: 200 },
  height: { type: "spring" as const, damping: 30, stiffness: 200 },
  backgroundColor: { duration: 0.2 },
  borderWidth: { duration: 0.2 },
}

const FOLLOWER_STYLE = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  borderRadius: "50%",
  pointerEvents: "none" as const,
  translateX: "-50%",
  translateY: "-50%",
}

const POINTER_STYLE = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  width: POINTER_SIZE,
  height: POINTER_SIZE,
  pointerEvents: "none" as const,
  translateX: "-30%",
  translateY: "-5%",
  backgroundImage: "url('/img/pointer.png')",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "contain",
  filter: "brightness(0) invert(1)",
}

function useCursorSpring(value: MotionValue<number>, smoothness: number) {
  return useSpring(value, {
    damping: 40 - smoothness * 2,
    stiffness: 350 - smoothness * 30,
  })
}

/**
 * Integry's premium circle cursor adapted from the published Framer component.
 * Pointer coordinates stay in MotionValues so mouse movement never re-renders
 * the page. Click sparks and focus positioning are local enhancements.
 */
export function CircleCursor() {
  const [enabled, setEnabled] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const frameRef = useRef<number | null>(null)
  const focusedElementRef = useRef<Element | null>(null)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const lastPointerActivityRef = useRef(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const ringSpringX = useCursorSpring(x, SMOOTHNESS)
  const ringSpringY = useCursorSpring(y, SMOOTHNESS)
  const dotSpringX = useSpring(x, { damping: 50, stiffness: 500 })
  const dotSpringY = useSpring(y, { damping: 50, stiffness: 500 })
  const focusX = useMotionValue(0)
  const focusY = useMotionValue(0)
  const haloSpringX = useCursorSpring(focusX, SMOOTHNESS)
  const haloSpringY = useCursorSpring(focusY, SMOOTHNESS)

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => setEnabled(finePointer.matches)

    sync()
    finePointer.addEventListener("change", sync)

    return () => {
      finePointer.removeEventListener("change", sync)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const previousCursor = document.body.style.cursor
    document.body.style.cursor = "none"
    document.documentElement.dataset.circleCursorActive = "true"

    const onMouseMove = (event: MouseEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      lastPointerActivityRef.current = performance.now()
      setVisible(true)
    }

    const onMouseOver = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest(INTERACTIVE_SELECTOR) : null
      setHovered(Boolean(target))
    }

    const onFocusIn = (event: FocusEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest(INTERACTIVE_SELECTOR) : null
      if (!target) return

      focusedElementRef.current = target
      const rect = target.getBoundingClientRect()
      focusX.set(rect.left + rect.width / 2)
      focusY.set(rect.top + rect.height / 2)
      setFocused(true)
      setVisible(true)
      const mouseEngaged = performance.now() - lastPointerActivityRef.current < POINTER_ENGAGE_MS
      setKeyboardFocus(!mouseEngaged)
    }

    const onFocusOut = (event: FocusEvent) => {
      const nextTarget =
        event.relatedTarget instanceof Element
          ? event.relatedTarget.closest(INTERACTIVE_SELECTOR)
          : null

      if (nextTarget) {
        focusedElementRef.current = nextTarget
        return
      }

      focusedElementRef.current = null
      setFocused(false)
      const pointerTarget = document
        .elementFromPoint(lastPointerRef.current.x, lastPointerRef.current.y)
        ?.closest(INTERACTIVE_SELECTOR)
      setHovered(Boolean(pointerTarget))
    }

    const show = () => setVisible(true)
    const hide = () => setVisible(false)
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") hide()
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true })
    window.addEventListener("mouseover", onMouseOver, { passive: true })
    window.addEventListener("focusin", onFocusIn)
    window.addEventListener("focusout", onFocusOut)
    window.addEventListener("mouseenter", show)
    window.addEventListener("mouseleave", hide)
    window.addEventListener("blur", hide)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      document.body.style.cursor = previousCursor
      delete document.documentElement.dataset.circleCursorActive
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseover", onMouseOver)
      window.removeEventListener("focusin", onFocusIn)
      window.removeEventListener("focusout", onFocusOut)
      window.removeEventListener("mouseenter", show)
      window.removeEventListener("mouseleave", hide)
      window.removeEventListener("blur", hide)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      setVisible(false)
      setHovered(false)
      setFocused(false)
      setKeyboardFocus(false)
      focusedElementRef.current = null
    }
  }, [enabled, x, y, focusX, focusY])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!enabled || !canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    let devicePixelRatio = 1

    const resize = () => {
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * devicePixelRatio)
      canvas.height = Math.round(window.innerHeight * devicePixelRatio)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    const draw = (time: number) => {
      if (document.visibilityState === "hidden") {
        frameRef.current = null
        return
      }

      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const activeSparks = sparksRef.current.filter(
        (spark) => time - spark.startedAt < SPARK_DURATION,
      )
      sparksRef.current = activeSparks

      activeSparks.forEach((spark) => {
        const progress = Math.min(Math.max((time - spark.startedAt) / SPARK_DURATION, 0), 1)
        const eased = 1 - Math.pow(1 - progress, 2)
        const distance = eased * SPARK_RADIUS
        const length = SPARK_LENGTH * (1 - progress)
        const directionX = Math.cos(spark.angle)
        const directionY = Math.sin(spark.angle)

        context.beginPath()
        context.moveTo(spark.x + directionX * distance, spark.y + directionY * distance)
        context.lineTo(
          spark.x + directionX * (distance + length),
          spark.y + directionY * (distance + length),
        )
        context.strokeStyle = SPARK_COLOR
        context.lineWidth = 1.5
        context.lineCap = "round"
        context.stroke()
      })

      canvas.dataset.active = String(activeSparks.length > 0)
      frameRef.current = activeSparks.length > 0 ? window.requestAnimationFrame(draw) : null
    }

    const schedule = () => {
      if (frameRef.current === null && document.visibilityState !== "hidden") {
        frameRef.current = window.requestAnimationFrame(draw)
      }
    }

    const onClick = (event: MouseEvent) => {
      if (event.detail > 0) lastPointerActivityRef.current = performance.now()
      const startedAt = performance.now()
      sparksRef.current.push(
        ...Array.from({ length: SPARK_COUNT }, (_, index) => ({
          x: event.clientX,
          y: event.clientY,
          angle: (Math.PI * 2 * index) / SPARK_COUNT,
          startedAt,
        })),
      )
      sparksRef.current = sparksRef.current.slice(-MAX_SPARKS)
      canvas.dataset.active = "true"
      schedule()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }
        return
      }
      schedule()
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("click", onClick)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("click", onClick)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      sparksRef.current = []
      canvas.dataset.active = "false"
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
  }, [enabled])

  return (
    <>
      <div
        data-circle-cursor
        data-enabled={enabled}
        data-hovered={hovered}
        data-focused={focused}
        aria-hidden="true"
        className="circle-cursor"
      >
        <canvas
          ref={canvasRef}
          data-circle-cursor-spark
          data-active="false"
          aria-hidden="true"
          className="circle-cursor-spark"
        />
        <motion.div
          data-circle-cursor-ring
          className="circle-cursor-element"
          style={{
            ...FOLLOWER_STYLE,
            x: ringSpringX,
            y: ringSpringY,
            borderColor: COLOR,
            borderStyle: "solid",
            willChange: "transform",
          }}
          initial={{
            width: RING_SIZE,
            height: RING_SIZE,
            opacity: 0,
            backgroundColor: TRANSPARENT,
            borderWidth: RING_THICKNESS,
          }}
          animate={{
            width: hovered ? HOVER_SIZE : RING_SIZE,
            height: hovered ? HOVER_SIZE : RING_SIZE,
            opacity: visible ? 1 : 0,
            backgroundColor: TRANSPARENT,
            borderWidth: RING_THICKNESS,
          }}
          transition={RING_TRANSITION}
        />
        <motion.div
          data-circle-cursor-dot
          className="circle-cursor-element"
          style={{
            ...FOLLOWER_STYLE,
            x: dotSpringX,
            y: dotSpringY,
            backgroundColor: COLOR,
            willChange: "transform",
          }}
          initial={{ width: DOT_SIZE, height: DOT_SIZE, opacity: 0 }}
          animate={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            opacity: visible && !hovered ? 1 : 0,
          }}
        />
        <motion.div
          data-circle-cursor-focus
          className="circle-cursor-element"
          style={{
            ...FOLLOWER_STYLE,
            x: haloSpringX,
            y: haloSpringY,
            borderColor: FOCUS_HALO_COLOR,
            borderStyle: "solid",
            borderWidth: 1,
            willChange: "transform, opacity",
          }}
          initial={{
            width: FOCUS_HALO_SIZE,
            height: FOCUS_HALO_SIZE,
            opacity: 0,
            scale: 0.72,
          }}
          animate={{
            width: FOCUS_HALO_SIZE,
            height: FOCUS_HALO_SIZE,
            opacity: focused && visible && keyboardFocus ? 1 : 0,
            scale: focused && keyboardFocus ? 1 : 0.72,
          }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { type: "spring", damping: 30, stiffness: 200 },
          }}
        />
        <motion.div
          data-circle-cursor-pointer
          aria-hidden="true"
          className="circle-cursor-element circle-cursor-pointer"
          style={{
            ...POINTER_STYLE,
            x: dotSpringX,
            y: dotSpringY,
            willChange: "transform, opacity",
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: visible && hovered ? 1 : 0,
            scale: hovered ? 1 : 0.92,
          }}
          transition={{
            opacity: { duration: 0.14 },
            scale: { type: "spring", damping: 30, stiffness: 240 },
          }}
        />
      </div>
    </>
  )
}

type Spark = {
  x: number
  y: number
  angle: number
  startedAt: number
}
