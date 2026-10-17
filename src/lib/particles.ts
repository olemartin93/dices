// Tiny canvas particle engine for sparks, shockwave rings, embers and confetti.

type Kind = 'spark' | 'ring' | 'confetti' | 'ember'

interface Particle {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  rot: number
  vr: number
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min)
const pickColor = (colors: readonly string[]): string => colors[Math.floor(Math.random() * colors.length)] ?? '#ffffff'

export class ParticleSystem {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private raf = 0
  private last = 0
  private width = 0
  private height = 0

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.canvas = canvas
    this.ctx = ctx
    this.resize()
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = Math.round(this.width * dpr)
    this.canvas.height = Math.round(this.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /** Sparks flying out of an impact point plus a shockwave ring. */
  burst(x: number, y: number, colors: readonly string[], power = 1): void {
    const count = Math.round(26 * power)
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(120, 420) * power
      this.particles.push({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        life: 0,
        maxLife: rand(0.35, 0.8),
        size: rand(1.5, 3.5),
        color: pickColor(colors),
        rot: 0,
        vr: 0,
      })
    }
    this.particles.push({
      kind: 'ring',
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.55,
      size: 60 * Math.sqrt(power),
      color: pickColor(colors),
      rot: 0,
      vr: 0,
    })
    this.start()
  }

  /** Glowing embers that drift downward, for a fumble. */
  embers(x: number, y: number, colors: readonly string[]): void {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        kind: 'ember',
        x: x + rand(-50, 50),
        y: y + rand(-30, 30),
        vx: rand(-40, 40),
        vy: rand(-120, 10),
        life: 0,
        maxLife: rand(0.9, 1.8),
        size: rand(1.5, 4),
        color: pickColor(colors),
        rot: 0,
        vr: 0,
      })
    }
    this.start()
  }

  /** Confetti raining from the top of the screen. */
  confetti(colors: readonly string[], count = 140): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind: 'confetti',
        x: rand(0, this.width),
        y: rand(-this.height * 0.4, -10),
        vx: rand(-60, 60),
        vy: rand(80, 260),
        life: 0,
        maxLife: rand(2.2, 3.6),
        size: rand(6, 11),
        color: pickColor(colors),
        rot: rand(0, Math.PI * 2),
        vr: rand(-8, 8),
      })
    }
    this.start()
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.particles = []
  }

  private start(): void {
    if (this.raf !== 0) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min((now - this.last) / 1000, 0.05)
    this.last = now
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    this.particles = this.particles.filter((p) => {
      p.life += dt
      if (p.life >= p.maxLife) return false
      const t = p.life / p.maxLife

      switch (p.kind) {
        case 'spark':
          p.vx *= 1 - 3 * dt
          p.vy = p.vy * (1 - 3 * dt) + 500 * dt
          break
        case 'ember':
          p.vx += rand(-60, 60) * dt
          p.vy += 140 * dt
          break
        case 'confetti':
          p.vx += Math.sin(now / 300 + p.rot) * 30 * dt
          p.vy = Math.min(p.vy + 200 * dt, 320)
          p.rot += p.vr * dt
          break
        case 'ring':
          break
      }
      p.x += p.vx * dt
      p.y += p.vy * dt

      ctx.save()
      ctx.globalAlpha = 1 - t
      if (p.kind === 'ring') {
        ctx.strokeStyle = p.color
        ctx.lineWidth = 3 * (1 - t)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (0.3 + t * 1.2), 0, Math.PI * 2)
        ctx.stroke()
      } else if (p.kind === 'confetti') {
        ctx.globalAlpha = Math.min(1, (1 - t) * 3)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.scale(1, Math.cos(p.rot * 1.7))
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.6), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      return true
    })

    if (this.particles.length > 0) {
      this.raf = requestAnimationFrame(this.tick)
    } else {
      this.raf = 0
      ctx.clearRect(0, 0, this.width, this.height)
    }
  }
}
