"use client"

import { Children, useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FuzzyTextProps {
  children: ReactNode
  fontSize?: number | string
  fontWeight?: string | number
  fontFamily?: string
  color?: string
  enableHover?: boolean
  baseIntensity?: number
  hoverIntensity?: number
  fuzzRange?: number
  fps?: number
  direction?: "horizontal" | "vertical" | "both"
  transitionDuration?: number
  clickEffect?: boolean
  glitchMode?: boolean
  glitchInterval?: number
  glitchDuration?: number
  letterSpacing?: number
  className?: string
}

/**
 * Canvas fuzzy text (ported 1:1 from reactbits FuzzyText, recolored to B/W).
 * The RAF loop pauses when the tab is hidden, hover/click are mouse-only, and
 * the canvas pauses its RAF loop while the tab is hidden.
 * The canvas is aria-hidden; pair it with real text in the DOM.
 */
export function FuzzyText({
  children,
  fontSize = "clamp(2rem, 8vw, 8rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#000",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = "horizontal",
  transitionDuration = 0,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  letterSpacing = 0,
  className,
}: FuzzyTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let animationFrameId = 0
    let isCancelled = false
    let isPaused = false
    let glitchTimeoutId: ReturnType<typeof setTimeout> | undefined
    let glitchEndTimeoutId: ReturnType<typeof setTimeout> | undefined
    let clickTimeoutId: ReturnType<typeof setTimeout> | undefined
    let onVisibilityChange: (() => void) | null = null
    let onMouseMove: ((event: MouseEvent) => void) | null = null
    let onMouseLeave: (() => void) | null = null
    let onClick: (() => void) | null = null
    let observer: IntersectionObserver | null = null
    const canvas = canvasRef.current
    if (!canvas) return

    const init = async () => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const computedFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily

      const fontSizeStr = typeof fontSize === "number" ? `${fontSize}px` : fontSize
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`

      try {
        await document.fonts.load(fontString)
      } catch {
        await document.fonts.ready
      }
      if (isCancelled) return

      let numericFontSize: number
      if (typeof fontSize === "number") {
        numericFontSize = fontSize
      } else {
        const temp = document.createElement("span")
        temp.style.fontSize = fontSize
        document.body.appendChild(temp)
        numericFontSize = parseFloat(window.getComputedStyle(temp).fontSize)
        document.body.removeChild(temp)
      }

      const text = Children.toArray(children).join("")

      const offscreen = document.createElement("canvas")
      const offCtx = offscreen.getContext("2d")
      if (!offCtx) return

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`
      offCtx.textBaseline = "alphabetic"

      let totalWidth = 0
      if (letterSpacing !== 0) {
        for (const char of text) {
          totalWidth += offCtx.measureText(char).width + letterSpacing
        }
        totalWidth -= letterSpacing
      } else {
        totalWidth = offCtx.measureText(text).width
      }

      const metrics = offCtx.measureText(text)
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0
      const actualRight =
        letterSpacing !== 0 ? totalWidth : (metrics.actualBoundingBoxRight ?? metrics.width)
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize
      const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2

      const textBoundingWidth = Math.ceil(
        letterSpacing !== 0 ? totalWidth : actualLeft + actualRight,
      )
      const tightHeight = Math.ceil(actualAscent + actualDescent)

      const extraWidthBuffer = 10
      const offscreenWidth = textBoundingWidth + extraWidthBuffer

      offscreen.width = offscreenWidth
      offscreen.height = tightHeight

      const xOffset = extraWidthBuffer / 2
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`
      offCtx.textBaseline = "alphabetic"
      offCtx.fillStyle = color

      if (letterSpacing !== 0) {
        let xPos = xOffset
        for (const char of text) {
          offCtx.fillText(char, xPos, actualAscent)
          xPos += offCtx.measureText(char).width + letterSpacing
        }
      } else {
        offCtx.fillText(text, xOffset - actualLeft, actualAscent)
      }

      const horizontalMargin = fuzzRange + 20
      const verticalMargin = direction === "vertical" || direction === "both" ? fuzzRange + 10 : 0
      canvas.width = offscreenWidth + horizontalMargin * 2
      canvas.height = tightHeight + verticalMargin * 2

      const interactiveLeft = horizontalMargin + xOffset
      const interactiveTop = verticalMargin
      const interactiveRight = interactiveLeft + textBoundingWidth
      const interactiveBottom = interactiveTop + tightHeight

      let isHovering = false
      let isClicking = false
      let isGlitching = false
      let currentIntensity = baseIntensity
      let targetIntensity = baseIntensity
      let lastFrameTime = 0
      const frameDuration = 1000 / fps
      let isVisible = true
      let isLoopActive = false

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return
        glitchTimeoutId = setTimeout(() => {
          if (isCancelled) return
          isGlitching = true
          glitchEndTimeoutId = setTimeout(() => {
            isGlitching = false
            startGlitchLoop()
          }, glitchDuration)
        }, glitchInterval)
      }

      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (let j = 0; j < tightHeight; j++) {
          const dx =
            direction === "horizontal" || direction === "both"
              ? Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange)
              : 0
          const dy =
            direction === "vertical" || direction === "both"
              ? Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5)
              : 0
          ctx.drawImage(
            offscreen,
            0,
            j,
            offscreenWidth,
            1,
            horizontalMargin + dx,
            verticalMargin + j + dy,
            offscreenWidth,
            1,
          )
        }
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting
          if (!isVisible) {
            isLoopActive = false
            cancelAnimationFrame(animationFrameId)
            return
          }
          if (isCancelled || isPaused || isLoopActive) return
          drawFrame()
          lastFrameTime = 0
          isLoopActive = true
          animationFrameId = window.requestAnimationFrame(run)
        },
        { rootMargin: "80px" },
      )
      observer.observe(canvas)

      const run = (timestamp: number) => {
        if (isCancelled || isPaused || !isVisible) {
          isLoopActive = false
          return
        }
        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = window.requestAnimationFrame(run)
          return
        }
        lastFrameTime = timestamp

        if (isClicking) {
          targetIntensity = 1
        } else if (isGlitching) {
          targetIntensity = 1
        } else if (isHovering) {
          targetIntensity = hoverIntensity
        } else {
          targetIntensity = baseIntensity
        }

        if (transitionDuration > 0) {
          const step = 1 / (transitionDuration / frameDuration)
          if (currentIntensity < targetIntensity) {
            currentIntensity = Math.min(currentIntensity + step, targetIntensity)
          } else if (currentIntensity > targetIntensity) {
            currentIntensity = Math.max(currentIntensity - step, targetIntensity)
          }
        } else {
          currentIntensity = targetIntensity
        }

        drawFrame()
        animationFrameId = window.requestAnimationFrame(run)
      }

      const handleVisibilityChange = () => {
        if (document.hidden) {
          isPaused = true
          isLoopActive = false
          cancelAnimationFrame(animationFrameId)
          if (glitchTimeoutId) clearTimeout(glitchTimeoutId)
          if (glitchEndTimeoutId) clearTimeout(glitchEndTimeoutId)
        } else if (!isCancelled && !isLoopActive) {
          isPaused = false
          lastFrameTime = 0
          isLoopActive = true
          animationFrameId = window.requestAnimationFrame(run)
          if (glitchMode) startGlitchLoop()
        }
      }

      const isInsideTextArea = (x: number, y: number) =>
        x >= interactiveLeft &&
        x <= interactiveRight &&
        y >= interactiveTop &&
        y <= interactiveBottom

      const handleMouseMove = (event: MouseEvent) => {
        if (!enableHover) return
        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        isHovering = isInsideTextArea(x, y)
      }

      const handleMouseLeave = () => {
        isHovering = false
      }

      const handleClick = () => {
        if (!clickEffect) return
        isClicking = true
        if (clickTimeoutId) clearTimeout(clickTimeoutId)
        clickTimeoutId = setTimeout(() => {
          isClicking = false
        }, 150)
      }

      onVisibilityChange = handleVisibilityChange
      document.addEventListener("visibilitychange", handleVisibilityChange)
      if (enableHover) {
        onMouseMove = handleMouseMove
        onMouseLeave = handleMouseLeave
        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("mouseleave", handleMouseLeave)
      }
      if (clickEffect) {
        onClick = handleClick
        canvas.addEventListener("click", handleClick)
      }

      if (glitchMode) startGlitchLoop()
      isLoopActive = true
      animationFrameId = window.requestAnimationFrame(run)
    }

    init()

    return () => {
      isCancelled = true
      cancelAnimationFrame(animationFrameId)
      if (glitchTimeoutId) clearTimeout(glitchTimeoutId)
      if (glitchEndTimeoutId) clearTimeout(glitchEndTimeoutId)
      if (clickTimeoutId) clearTimeout(clickTimeoutId)
      if (onVisibilityChange) {
        document.removeEventListener("visibilitychange", onVisibilityChange)
      }
      if (onMouseMove) {
        canvas.removeEventListener("mousemove", onMouseMove)
      }
      if (onMouseLeave) {
        canvas.removeEventListener("mouseleave", onMouseLeave)
      }
      if (onClick) {
        canvas.removeEventListener("click", onClick)
      }
      observer?.disconnect()
      observer = null
    }
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    fps,
    direction,
    transitionDuration,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
    letterSpacing,
  ])

  return (
    <canvas ref={canvasRef} data-fuzzy-text aria-hidden="true" className={cn("block", className)} />
  )
}
