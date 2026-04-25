import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from '../styles.css';

interface Props {
  /** Bumping this value triggers a single confetti burst. */
  trigger: number;
  /** Total particle count. Default 80. */
  count?: number;
  /** Lifetime per particle in ms. Default 1400. */
  lifetime?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  color: string;
  born: number;
}

const COLORS = ['#6b42e8', '#d149c5', '#fc4d5b', '#ffd458', '#22a06e'];

/**
 * Lightweight canvas confetti. Renders only while particles are alive,
 * then unmounts back to a no-op pass-through. Triggers a fresh burst
 * every time `trigger` changes (we use it for first-drop celebration).
 */
export function Confetti({ trigger, count = 80, lifetime = 1400 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTriggerRef = useRef<number>(trigger);

  useEffect(() => {
    if (trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        size: 4 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        born: start,
      });
    }

    let raf = 0;
    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles) {
        const age = ts - p.born;
        if (age > lifetime) continue;
        alive++;
        // Physics: gravity + air drag.
        p.vy += 0.3;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        const opacity = 1 - age / lifetime;
        ctx.save();
        ctx.globalAlpha = Math.max(0, opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (alive > 0) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [trigger, count, lifetime]);

  return <canvas ref={canvasRef} class={styles.confettiCanvas} />;
}
