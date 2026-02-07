import { useEffect, useRef, useState } from 'react';
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

interface MascotData {
  emoji: string;
  x: number;
  y: number;
  baseY: number;
  bobSpeed: number;
  bobAmount: number;
  size: number;
  side: 'left' | 'right';
}

function FloatingMascots({ mascots }: { mascots: string[] }) {
  const [mascotData, setMascotData] = useState<MascotData[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const data: MascotData[] = mascots.slice(0, 4).map((emoji, i) => ({
      emoji,
      x: i % 2 === 0 ? 10 + Math.random() * 60 : window.innerWidth - 70 - Math.random() * 60,
      y: window.innerHeight * 0.6 + Math.random() * (window.innerHeight * 0.25),
      baseY: window.innerHeight * 0.6 + Math.random() * (window.innerHeight * 0.25),
      bobSpeed: 0.5 + Math.random() * 0.5,
      bobAmount: 8 + Math.random() * 12,
      size: 32 + Math.random() * 16,
      side: i % 2 === 0 ? 'left' : 'right',
    }));
    setMascotData(data);

    const animate = () => {
      timeRef.current += 0.016;
      setMascotData(prev =>
        prev.map(m => ({
          ...m,
          y: m.baseY + Math.sin(timeRef.current * m.bobSpeed * Math.PI * 2) * m.bobAmount,
        }))
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mascots]);

  return (
    <>
      {mascotData.map((m, i) => (
        <div
          key={i}
          className="fixed pointer-events-none z-40 transition-opacity duration-1000"
          style={{
            left: m.side === 'left' ? `${m.x}px` : 'auto',
            right: m.side === 'right' ? `${window.innerWidth - m.x - m.size}px` : 'auto',
            top: `${m.y}px`,
            fontSize: `${m.size}px`,
            opacity: 0.7,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            transform: m.side === 'left' ? 'scaleX(1)' : 'scaleX(-1)',
          }}
        >
          {m.emoji}
        </div>
      ))}
    </>
  );
}

export function ThemeParticles() {
  const { themeConfig } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  const particleType = themeConfig.effects.particles;
  const mascots = themeConfig.mascots;

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

  if (!particleType && !mascots?.length) return null;

  return (
    <>
      {particleType && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ mixBlendMode: 'normal' }}
        />
      )}
      {mascots && mascots.length > 0 && (
        <FloatingMascots mascots={mascots} />
      )}
    </>
  );
}