import * as React from 'react'

type Book3DMockupProps = {
  frontDataUrl: string
  spineDataUrl: string
  trim: { widthIn: number; heightIn: number }
  spineWidthIn: number
  heightPx?: number
  className?: string
}

// Minimum visible spine depth for thin books. Real spines below ~0.2"
// would disappear behind subpixel rendering, so we floor the visual depth.
const MIN_SPINE_VISUAL_PX = 10

export function Book3DMockup({
  frontDataUrl,
  spineDataUrl,
  trim,
  spineWidthIn,
  heightPx = 320,
  className
}: Book3DMockupProps): React.JSX.Element {
  const scale = heightPx / trim.heightIn
  const frontW = trim.widthIn * scale
  const bookH = heightPx
  const spineW = Math.max(spineWidthIn * scale, MIN_SPINE_VISUAL_PX)

  // A little vertical room so the shadow + slight rotation don't clip.
  const sceneHeight = bookH + 64

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: sceneHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: `${Math.max(frontW * 6, 1400)}px`,
        perspectiveOrigin: '50% 50%',
        overflow: 'hidden'
      }}
    >
      <div
        className="bf-book"
        style={{
          position: 'relative',
          width: frontW,
          height: bookH,
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-28deg) rotateX(3deg)',
          transition: 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* Front cover */}
        <div
          style={{
            ...faceBase(frontW, bookH),
            backgroundImage: `url(${frontDataUrl})`,
            transform: `translateZ(${spineW / 2}px)`,
            boxShadow: '0 0 1px rgba(0,0,0,0.6)'
          }}
        />

        {/* Spine */}
        <div
          style={{
            ...faceBase(spineW, bookH),
            backgroundImage: `url(${spineDataUrl})`,
            transform: `rotateY(-90deg) translateZ(${frontW / 2}px)`
          }}
        />

        {/* Right edge — simulated page block */}
        <div
          style={{
            ...faceBase(spineW, bookH),
            background: 'linear-gradient(to right, #fbf7ec 0%, #e9e2cd 100%)',
            transform: `rotateY(90deg) translateZ(${frontW / 2}px)`
          }}
        />

        {/* Top edge — thin page stack visible from above */}
        <div
          style={{
            ...faceBase(frontW, spineW),
            background: 'linear-gradient(to bottom, #f6f1df 0%, #dcd4b8 100%)',
            transform: `rotateX(90deg) translateZ(${bookH / 2}px)`
          }}
        />

        {/* Bottom edge */}
        <div
          style={{
            ...faceBase(frontW, spineW),
            background: 'linear-gradient(to bottom, #dcd4b8 0%, #b9b094 100%)',
            transform: `rotateX(-90deg) translateZ(${bookH / 2}px)`
          }}
        />

        {/* Back (solid, since we don't show it at this angle but it rounds out the box) */}
        <div
          style={{
            ...faceBase(frontW, bookH),
            background: 'rgba(30,30,30,0.9)',
            transform: `rotateY(180deg) translateZ(${spineW / 2}px)`
          }}
        />

        {/* Ground shadow */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '-15%',
            right: '-15%',
            bottom: -18,
            height: 22,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 70%)',
            filter: 'blur(4px)',
            transform: `translateZ(${-spineW / 2 - 1}px) rotateX(90deg)`,
            pointerEvents: 'none'
          }}
        />
      </div>

      <style>{`
        .bf-book:hover {
          transform: rotateY(-10deg) rotateX(2deg) !important;
        }
      `}</style>
    </div>
  )
}

function faceBase(
  width: number,
  height: number
): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width,
    height,
    marginLeft: -width / 2,
    marginTop: -height / 2,
    backgroundSize: '100% 100%',
    backgroundPosition: 'center',
    backfaceVisibility: 'hidden'
  }
}
