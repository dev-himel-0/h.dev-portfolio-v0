"use client";

import { useEffect, useRef } from "react";
import type { Mesh, Program, Renderer, Triangle } from "ogl";
import { cn } from "@/lib/utils";

type RGB = [number, number, number];

export interface FerrofluidBackgroundProps {
  className?: string;
  colors?: readonly string[];
  dpr?: number;
  speed?: number;
  scale?: number;
  turbulence?: number;
  fluidity?: number;
  rimWidth?: number;
  sharpness?: number;
  shimmer?: number;
  glow?: number;
  opacity?: number;
  renderScale?: number;
  maxFps?: number;
  flowDirection?: "up" | "down" | "left" | "right";
}

const DEFAULT_COLORS = ["#ffffff", "#a8a8a8", "#555555"] as const;
const MAX_COLORS = 8;

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision mediump float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform vec3 uColor7;
uniform int uColorCount;
uniform vec2 uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uOpacity;

varying vec2 vUv;

#define PI 3.14159265

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int index = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (index <= 0) return uColor0;
  if (index == 1) return uColor1;
  if (index == 2) return uColor2;
  if (index == 3) return uColor3;
  if (index == 4) return uColor4;
  if (index == 5) return uColor5;
  if (index == 6) return uColor6;
  return uColor7;
}

float hash(vec3 point) {
  point = fract(point * 0.1031);
  point += dot(point, point.zyx + 33.33);
  return fract((point.x + point.y) * point.z);
}

float smoothMin(float first, float second, float softness) {
  float result = exp2(-first / softness) + exp2(-second / softness);
  return -softness * log2(result);
}

float sineLerp(float first, float second, float weight) {
  return mix(first, second, smoothstep(0.0, 1.0, weight));
}

float valueNoise(vec2 point, float size, float seed) {
  vec2 cell = floor(point / size);
  vec2 relative = mod(point, size);
  float first = hash(vec3(cell, seed));
  float second = hash(vec3(cell.x + 1.0, cell.y, seed));
  float third = hash(vec3(cell.x + 1.0, cell.y + 1.0, seed));
  float fourth = hash(vec3(cell.x, cell.y + 1.0, seed));
  float bottom = sineLerp(first, second, relative.x / size);
  float top = sineLerp(fourth, third, relative.x / size);
  return sineLerp(bottom, top, relative.y / size);
}

float detailNoise(vec2 point, float size, float seed) {
  float offset = size / 2.0;
  float base = valueNoise(point, size, seed);
  float one = valueNoise(point + vec2(offset, offset), size, seed + 0.1);
  float two = valueNoise(point + vec2(-offset, offset), size, seed + 0.2);
  return (2.0 * base + 1.35 * one + two) / 4.35;
}

void mainImage(out vec4 outputColor, in vec2 fragmentCoordinate) {
  float reference = 700.0 / max(uScale, 0.05);
  vec2 point = fragmentCoordinate / iResolution.y * reference;
  float time = iTime;
  float speed = 200.0 * uSpeed;
  vec2 direction = uFlow;
  vec2 perpendicular = vec2(-direction.y, direction.x);

  float distortionOne = valueNoise(
    point + perpendicular * (time * speed),
    60.0,
    10.0
  ) * 50.0 * uTurbulence;
  float distortionTwo = valueNoise(
    point - perpendicular * (time * speed),
    120.0,
    15.0
  ) * 100.0 * uTurbulence;
  float peaks = detailNoise(
    point + distortionOne + direction * (time * speed * 0.5),
    40.0,
    1.0
  );
  float peaksTwo = detailNoise(
    point + distortionTwo - direction * (time * speed * 0.5),
    40.0,
    0.0
  );
  float combinedPeaks = smoothMin(peaks, peaksTwo, max(uFluidity, 0.001));
  float band = (uRimWidth - abs((combinedPeaks - 0.4) * 2.0)) * 5.0;
  float light = clamp(
    band - valueNoise(point + direction * (time * speed * 0.5), 60.0, 12.0) * uShimmer,
    0.0,
    1.0
  );
  light = pow(light, uSharpness) * uGlow;

  float hue = clamp(0.5 + (peaks - peaksTwo) * 0.8, 0.0, 1.0);
  vec3 color = palette(hue) * light;
  float alpha = clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0);
  outputColor = vec4(color, alpha * uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

const hexToRgb = (hex: string): RGB => {
  const value = hex.replace("#", "").padEnd(6, "0");
  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
  ];
};

const prepareColors = (input: readonly string[]) => {
  const colors = (input.length ? input : DEFAULT_COLORS).slice(0, MAX_COLORS);
  const values = Array.from({ length: MAX_COLORS }, (_, index) =>
    hexToRgb(colors[Math.min(index, colors.length - 1)]),
  );

  return { values, count: colors.length };
};

const flowVector = (
  direction: FerrofluidBackgroundProps["flowDirection"],
): [number, number] => {
  switch (direction) {
    case "up":
      return [0, 1];
    case "left":
      return [-1, 0];
    case "right":
      return [1, 0];
    default:
      return [0, -1];
  }
};

const dispose = (target: unknown, method: string) => {
  const candidate = target as Record<string, unknown> | null;
  const callback = candidate?.[method];
  if (typeof callback === "function") {
    callback.call(target);
  }
};

export function FerrofluidBackground({
  className,
  colors = DEFAULT_COLORS,
  dpr,
  speed = 0.17,
  scale = 1.55,
  turbulence = 0.55,
  fluidity = 0.12,
  rimWidth = 0.18,
  sharpness = 2.8,
  shimmer = 0.75,
  glow = 1.35,
  opacity = 0.72,
  renderScale = 0.75,
  maxFps = 30,
  flowDirection = "down",
}: FerrofluidBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      container.dataset.ferrofluidState = "reduced";
      return;
    }

    const isTouchDevice = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    const frameInterval = maxFps > 0 ? 1000 / Math.min(maxFps, 60) : 0;

    let renderer: Renderer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let program: Program | null = null;
    let mesh: Mesh | null = null;
    let geometry: Triangle | null = null;
    let uniforms: Record<string, { value: number | number[] | RGB }> | null =
      null;
    let animationFrame: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    const hasResizeObserver = typeof ResizeObserver !== "undefined";
    const hasIntersectionObserver = typeof IntersectionObserver !== "undefined";
    let inViewport = !hasIntersectionObserver;
    let documentVisible = !document.hidden;
    let initialized = false;
    let initializationPending = false;
    let cancelled = false;
    let contextLost = false;
    let lastRenderTime = Number.NEGATIVE_INFINITY;
    let renderedWidth = 0;
    let renderedHeight = 0;
    let contextLostHandler: ((event: Event) => void) | null = null;

    const stop = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const resize = () => {
      if (!renderer || !uniforms) return;

      const rect = container.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (
        width === 0 ||
        height === 0 ||
        (width === renderedWidth && height === renderedHeight)
      ) {
        return;
      }

      renderer.setSize(width, height);
      uniforms.iResolution.value = [
        renderer.gl.drawingBufferWidth,
        renderer.gl.drawingBufferHeight,
        1,
      ];
      renderedWidth = width;
      renderedHeight = height;
    };

    const draw = (time: number) => {
      if (!renderer || !mesh || !uniforms) return;

      uniforms.iTime.value = time * 0.001;
      renderer.render({ scene: mesh, frustumCull: false, sort: false });
    };

    const fail = () => {
      contextLost = true;
      stop();
      container.dataset.ferrofluidState = "fallback";
    };

    const renderStaticFrame = () => {
      if (!documentVisible || !inViewport || contextLost) return;

      try {
        draw(performance.now());
      } catch {
        fail();
      }
    };

    const render = (time: number) => {
      animationFrame = null;
      if (!documentVisible || !inViewport || contextLost || !initialized) {
        return;
      }

      if (frameInterval > 0 && time - lastRenderTime < frameInterval) {
        animationFrame = requestAnimationFrame(render);
        return;
      }

      lastRenderTime = time;
      try {
        draw(time);
        animationFrame = requestAnimationFrame(render);
      } catch {
        fail();
      }
    };

    const start = () => {
      if (!documentVisible || !inViewport || contextLost || !initialized) {
        return;
      }

      if (isTouchDevice) {
        renderStaticFrame();
        return;
      }

      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    const disposeResources = () => {
      stop();
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener("resize", resize);
      }
      if (canvas) {
        if (contextLostHandler) {
          canvas.removeEventListener("webglcontextlost", contextLostHandler);
        }
        if (canvas.parentElement === container) {
          container.removeChild(canvas);
        }
      }
      dispose(program, "remove");
      dispose(geometry, "remove");
      dispose(mesh, "remove");
      dispose(renderer, "destroy");
    };

    const initialize = async () => {
      if (
        initializationPending ||
        initialized ||
        cancelled ||
        !documentVisible ||
        !inViewport
      ) {
        return;
      }

      initializationPending = true;

      try {
        const {
          Mesh: OGLMesh,
          Program: OGLProgram,
          Renderer: OGLRenderer,
          Triangle: OGLTriangle,
        } = await import("ogl");

        if (cancelled || !documentVisible || !inViewport) {
          initializationPending = false;
          return;
        }

        const requestedDpr = dpr ?? (window.devicePixelRatio || 1);
        const effectiveDpr = Math.max(
          0.5,
          Math.min(requestedDpr, 1) * Math.min(Math.max(renderScale, 0.5), 1),
        );
        renderer = new OGLRenderer({
          dpr: effectiveDpr,
          alpha: true,
          depth: false,
          antialias: false,
        });
        const gl = renderer.gl;
        canvas = gl.canvas as HTMLCanvasElement;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.pointerEvents = "none";
        gl.clearColor(0, 0, 0, 0);
        container.appendChild(canvas);

        const prepared = prepareColors(colors);
        uniforms = {
          iResolution: {
            value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1],
          },
          iTime: { value: 0 },
          uColor0: { value: prepared.values[0] },
          uColor1: { value: prepared.values[1] },
          uColor2: { value: prepared.values[2] },
          uColor3: { value: prepared.values[3] },
          uColor4: { value: prepared.values[4] },
          uColor5: { value: prepared.values[5] },
          uColor6: { value: prepared.values[6] },
          uColor7: { value: prepared.values[7] },
          uColorCount: { value: prepared.count },
          uFlow: { value: flowVector(flowDirection) },
          uSpeed: { value: speed },
          uScale: { value: scale },
          uTurbulence: { value: turbulence },
          uFluidity: { value: fluidity },
          uRimWidth: { value: rimWidth },
          uSharpness: { value: sharpness },
          uShimmer: { value: shimmer },
          uGlow: { value: glow },
          uOpacity: { value: opacity },
        };

        program = new OGLProgram(gl, { vertex, fragment, uniforms });
        geometry = new OGLTriangle(gl);
        mesh = new OGLMesh(gl, { geometry, program });
        initialized = true;
        initializationPending = false;

        resize();
        if (hasResizeObserver) {
          resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(container);
        } else {
          window.addEventListener("resize", resize);
        }

        canvas.addEventListener("webglcontextlost", onContextLost, false);
        container.dataset.ferrofluidState = isTouchDevice ? "static" : "active";
        start();
      } catch {
        initializationPending = false;
        disposeResources();
        if (!cancelled) {
          container.dataset.ferrofluidState = "fallback";
        }
      }
    };

    const onVisibilityChange = () => {
      documentVisible = !document.hidden;
      if (documentVisible) {
        void initialize();
        start();
      } else {
        stop();
      }
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };

    contextLostHandler = onContextLost;
    container.dataset.ferrofluidState = "idle";
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (hasIntersectionObserver) {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          inViewport = entry?.isIntersecting ?? false;
          if (inViewport) {
            void initialize();
            start();
          } else {
            stop();
          }
        },
        { rootMargin: "240px" },
      );
      intersectionObserver.observe(container);
    } else {
      void initialize();
    }

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      intersectionObserver?.disconnect();
      disposeResources();
    };
  }, [
    colors,
    dpr,
    flowDirection,
    fluidity,
    glow,
    opacity,
    rimWidth,
    scale,
    sharpness,
    shimmer,
    speed,
    turbulence,
    maxFps,
    renderScale,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-ferrofluid-background
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-black",
        className,
      )}
    />
  );
}
