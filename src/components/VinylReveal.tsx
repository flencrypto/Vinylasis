import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimate,
  AnimatePresence,
} from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ScoredPressingCandidate } from '@/lib/pressing-identification-ai'

interface VinylRevealProps {
  candidates: ScoredPressingCandidate[]
  onRevealComplete: () => void
  /** Optional short preview audio URL (5–8 s clip) */
  previewAudioUrl?: string
}

export function VinylReveal({ candidates, onRevealComplete, previewAudioUrl }: VinylRevealProps) {
  const [phase, setPhase] = useState<'spinning' | 'needle' | 'done'>('spinning')

  // ── Motion values ──────────────────────────────────────────────────────────
  const rotate = useMotionValue(0)
  const springRotate = useSpring(rotate, { stiffness: 65, damping: 18, mass: 1.2 })
  const [needleScope, animateNeedle] = useAnimate()

  // Drag-to-spin
  const x = useMotionValue(0)
  const dragRotate = useTransform(x, [-300, 300], [-720, 720])
  const combinedRotate = useTransform(
    [springRotate, dragRotate],
    ([s, d]: number[]) => s + d
  )

  // 3D tilt while dragging
  const tiltX = useTransform(x, [-200, 200], [12, -12])
  const tiltY = useTransform(x, [-200, 200], [-12, 12])

  // Reactive groove glow synced to rotation
  const glowOpacity = useTransform(
    springRotate,
    (latest: number) => Math.min(0.95, Math.abs((latest % 360) - 180) / 180)
  )

  // ── Web Audio ──────────────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null)
  const crackleBufferRef = useRef<AudioBuffer | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const crackleSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const initAudio = useCallback(async () => {
    if (audioCtxRef.current) return
    const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    audioCtxRef.current = ctx

    const gain = ctx.createGain()
    gain.gain.value = 0.35
    gainRef.current = gain

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 8000
    filterRef.current = filter

    gain.connect(filter)
    filter.connect(ctx.destination)

    // Load crackle if asset is present — fail silently if not
    try {
      const res = await fetch('/sounds/vinyl-crackle.mp3')
      if (res.ok) {
        const buf = await res.arrayBuffer()
        crackleBufferRef.current = await ctx.decodeAudioData(buf)
      }
    } catch {
      // asset not present — continue silently
    }
  }, [])

  const startAudio = useCallback(async () => {
    await initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    if (crackleBufferRef.current) {
      const src = ctx.createBufferSource()
      src.buffer = crackleBufferRef.current
      src.loop = true
      src.connect(gainRef.current!)
      src.start()
      crackleSourceRef.current = src
    }

    if (previewAudioUrl) {
      try {
        const res = await fetch(previewAudioUrl)
        if (res.ok) {
          const buf = await res.arrayBuffer()
          const decoded = await ctx.decodeAudioData(buf)
          const src = ctx.createBufferSource()
          src.buffer = decoded
          src.connect(gainRef.current!)
          src.start()
        }
      } catch {
        // preview unavailable
      }
    }
  }, [initAudio, previewAudioUrl])

  // Sync low-pass filter cutoff to spin velocity (the record feels alive)
  useEffect(() => {
    let prev = 0
    const unsub = springRotate.on('change', (latest: number) => {
      if (filterRef.current && audioCtxRef.current) {
        const vel = Math.abs(latest - prev)
        prev = latest
        const freq = Math.max(1200, 8000 - vel * 35)
        filterRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.08)
      }
    })
    return unsub
  }, [springRotate])

  // ── Orchestration ──────────────────────────────────────────────────────────
  const needleDrop = useCallback(async () => {
    setPhase('needle')
    if (needleScope.current) {
      await animateNeedle(needleScope.current, { rotate: -38 }, { duration: 0.65, ease: 'easeInOut' })
    }
    await startAudio()

    setTimeout(() => {
      // Fade out audio
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1.2)
      }
      setPhase('done')
      onRevealComplete()
    }, 3200)
  }, [animateNeedle, needleScope, onRevealComplete, startAudio])

  useEffect(() => {
    const run = async () => {
      // 3.5 full spins, then needle drops
      await new Promise<void>(resolve => {
        rotate.set(0)
        const target = 1260
        const duration = 3200
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3) // easeOut cubic
          rotate.set(eased * target)
          if (t < 1) requestAnimationFrame(tick)
          else resolve()
        }
        requestAnimationFrame(tick)
      })
      await needleDrop()
    }
    run().catch(console.error)

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        rotate.set(rotate.get() + 360)
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
      crackleSourceRef.current?.stop()
      audioCtxRef.current?.close()
    }
    // needleDrop is stable after mount; only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragEnd = () => {
    const vel = x.getVelocity()
    if (Math.abs(vel) > 800 && gainRef.current) {
      gainRef.current.gain.value = 0.55
      setTimeout(() => { if (gainRef.current) gainRef.current.gain.value = 0.35 }, 600)
    }
    rotate.set(rotate.get() + vel * 0.55)
  }

  const topCandidate = candidates[0] ?? null
  const labelImageUrl = topCandidate?.imageUrls?.[0]

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center justify-center gap-8 py-8 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Vinyl disc with drag-to-spin and 3D tilt */}
        <div className="relative flex items-center justify-center" style={{ perspective: 800 }}>
          {/* Groove glow aura */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              opacity: glowOpacity,
              background: 'radial-gradient(circle, rgba(196,151,63,0.55) 0%, rgba(196,151,63,0) 70%)',
              filter: 'blur(18px)',
            }}
          />

          {/* The vinyl disc */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDrag={(_, info) => x.set(info.offset.x)}
            onDragEnd={handleDragEnd}
            style={{
              rotate: combinedRotate,
              rotateX: tiltX,
              rotateY: tiltY,
              width: 220,
              height: 220,
              cursor: 'grab',
            }}
            whileDrag={{ cursor: 'grabbing', scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <VinylDisc labelImageUrl={labelImageUrl} labelText={topCandidate?.pressingName ?? ''} />
          </motion.div>

          {/* Tonearm / needle */}
          <motion.div
            ref={needleScope}
            className="absolute"
            style={{
              top: 8,
              right: -28,
              originX: '100%',
              originY: '0%',
              rotate: -60,
            }}
          >
            <ToneArm />
          </motion.div>
        </div>

        {/* Info below the disc */}
        <motion.div
          className="text-center space-y-1 px-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phase !== 'spinning' ? 1 : 0, y: phase !== 'spinning' ? 0 : 8 }}
          transition={{ duration: 0.5 }}
        >
          {topCandidate ? (
            <>
              <p className="text-lg font-semibold text-foreground leading-tight">
                {topCandidate.artistName}
              </p>
              <p className="text-sm text-muted-foreground">
                {topCandidate.releaseTitle}
                {topCandidate.year ? ` · ${topCandidate.year}` : ''}
              </p>
              <p className="text-xs text-amber-400 font-medium">
                {Math.round(topCandidate.confidence * 100)}% confidence · {topCandidate.confidenceBand}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Scanning complete</p>
          )}
        </motion.div>

        {/* Hint */}
        <p className="text-xs text-muted-foreground/50 mt-1">
          Drag to spin · Space to boost
        </p>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VinylDisc({ labelImageUrl, labelText }: { labelImageUrl?: string; labelText: string }) {
  return (
    <svg viewBox="0 0 220 220" width={220} height={220} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vinylBody" cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#080808" />
        </radialGradient>
        <radialGradient id="labelGrad" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <filter id="discShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,0,0,0.7)" />
        </filter>
        <clipPath id="labelClip">
          <circle cx="110" cy="110" r="38" />
        </clipPath>
      </defs>

      {/* Outer disc */}
      <circle cx="110" cy="110" r="106" fill="url(#vinylBody)" filter="url(#discShadow)" />

      {/* Groove rings */}
      {[30, 50, 68, 84, 98].map((r, i) => (
        <circle key={i} cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
      ))}

      {/* Label area */}
      {labelImageUrl ? (
        <image
          href={labelImageUrl}
          x="72" y="72"
          width="76" height="76"
          clipPath="url(#labelClip)"
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <circle cx="110" cy="110" r="38" fill="url(#labelGrad)" />
      )}

      {/* Label text */}
      {!labelImageUrl && (
        <text
          x="110" y="106"
          textAnchor="middle"
          fill="rgba(0,0,0,0.65)"
          fontSize="8"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          letterSpacing="1.2"
        >
          {labelText.slice(0, 18).toUpperCase()}
        </text>
      )}

      {/* Spindle hole */}
      <circle cx="110" cy="110" r="4" fill="#080808" />
      <circle cx="110" cy="110" r="2" fill="#1a1a1a" />

      {/* Shine overlay */}
      <ellipse cx="80" cy="70" rx="28" ry="16" fill="rgba(255,255,255,0.045)" />
    </svg>
  )
}

function ToneArm() {
  return (
    <svg width="52" height="80" viewBox="0 0 52 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
      </defs>
      {/* Pivot base */}
      <circle cx="42" cy="8" r="7" fill="#374151" stroke="#6b7280" strokeWidth="1.2" />
      <circle cx="42" cy="8" r="3.5" fill="#1f2937" />
      {/* Arm */}
      <line x1="42" y1="8" x2="10" y2="70" stroke="url(#armGrad)" strokeWidth="3" strokeLinecap="round" />
      {/* Headshell */}
      <rect x="4" y="66" width="12" height="10" rx="2" fill="#4b5563" stroke="#9ca3af" strokeWidth="0.8" />
      {/* Stylus */}
      <line x1="10" y1="76" x2="10" y2="82" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
