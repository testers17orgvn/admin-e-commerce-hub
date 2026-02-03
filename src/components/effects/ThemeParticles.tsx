import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  emoji: string;
}

const PARTICLE_CONFIGS = {
  snow: {
    emojis: ['❄️', '❅', '❆', '✻'],
    count: 50,
    speedRange: { x: [-0.5, 0.5], y: [1, 3] },
    sizeRange: [10, 20],
  },
  petals: {
    emojis: ['🌸', '🌺', '💮', '🏵️'],
    count: 30,
    speedRange: { x: [-1, 1], y: [0.5, 2] },
    sizeRange: [15, 25],
  },
  leaves: {
    emojis: ['🍂', '🍁', '🍃', '🌿'],
    count: 35,
    speedRange: { x: [-1.5, 1.5], y: [0.5, 2.5] },
    sizeRange: [18, 28],
  },
  hearts: {
    emojis: ['❤️', '💕', '💖', '💗', '💓'],
    count: 25,
    speedRange: { x: [-0.3, 0.3], y: [0.5, 1.5] },
    sizeRange: [12, 22],
  },
  stars: {
    emojis: ['⭐', '✨', '🌟', '💫'],
    count: 40,
    speedRange: { x: [-0.2, 0.2], y: [0.3, 1] },
    sizeRange: [10, 18],
  },
  lanterns: {
    emojis: ['🏮', '🪔', '🧧', '✨'],
    count: 20,
    speedRange: { x: [-0.5, 0.5], y: [0.3, 1] },
    sizeRange: [20, 35],
  },
  pumpkins: {
    emojis: ['🎃', '👻', '🦇', '🕷️', '🕸️'],
    count: 25,
    speedRange: { x: [-0.8, 0.8], y: [0.5, 1.5] },
    sizeRange: [15, 28],
  },
};

export function ThemeParticles() {
  const { themeConfig } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  const particleType = themeConfig.effects.particles;

  useEffect(() => {
    if (!particleType || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = PARTICLE_CONFIGS[particleType];
    if (!config) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => {
      const emoji = config.emojis[Math.floor(Math.random() * config.emojis.length)];
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
        speedX: config.speedRange.x[0] + Math.random() * (config.speedRange.x[1] - config.speedRange.x[0]),
        speedY: config.speedRange.y[0] + Math.random() * (config.speedRange.y[1] - config.speedRange.y[0]),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: 0.4 + Math.random() * 0.4,
        emoji,
      };
    };

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < config.count; i++) {
        const particle = createParticle();
        particle.y = Math.random() * canvas.height;
        particlesRef.current.push(particle);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;

        if (particle.y > canvas.height + 50) {
          particlesRef.current[index] = createParticle();
        }

        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;
        ctx.font = `${particle.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.emoji, 0, 0);
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleType]);

  if (!particleType) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
