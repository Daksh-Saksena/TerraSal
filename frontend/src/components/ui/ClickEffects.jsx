import { useEffect, useRef, useState } from 'react';
import { playSound, isSoundEnabled, getAudioContext } from '../../utils/soundEffects';
import './ClickEffects.css';

// Signature TerraSal palette for particles
const PARTICLE_COLORS = [
  '#008a50', // TerraSal Forest Emerald
  '#10b981', // Mint Bright
  '#34d399', // Fresh Leaf
  '#06b6d4', // Pure Water Cyan
  '#38bdf8', // Sky Blue
  '#f59e0b', // Solar Amber
  '#ffffff', // Sparkle White
];

export default function ClickEffects() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const ripplesRef = useRef([]);
  const animFrameRef = useRef(null);
  const [visualsEnabled] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation loop for physics & particles
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += r.speed;
        r.alpha -= r.decay;

        if (r.alpha <= 0) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(0, r.radius), 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.lineWidth = r.lineWidth;
        ctx.stroke();
        ctx.restore();
      }

      // Render particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // friction
        p.vy = p.vy * 0.94 + 0.12; // friction + slight gravity
        p.alpha -= p.decay;
        p.size *= 0.96; // shrink slightly

        if (p.alpha <= 0 || p.size <= 0.2) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (particlesRef.current.length > 0 || ripplesRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        animFrameRef.current = null;
      }
    };

    const startAnimation = () => {
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    // Global click listener for satisfying sound & visual bursts
    const handleClick = (e) => {
      // Resume audio context if suspended
      getAudioContext();

      const target = e.target;
      if (!target) return;

      // Find if clicking an interactive element
      const interactiveEl = target.closest(
        'button, a, input, select, textarea, [role="button"], [role="tab"], .nav-item, .card, .clickable, .tab-btn, .pill, .filter-chip, [data-sound]'
      );

      const x = e.clientX;
      const y = e.clientY;

      // Determine sound to play
      if (interactiveEl) {
        const explicitSound = interactiveEl.getAttribute('data-sound');

        if (explicitSound === 'none') {
          // Explicit silence requested
        } else if (explicitSound) {
          playSound(explicitSound);
        } else if (interactiveEl.tagName === 'INPUT' && (interactiveEl.type === 'checkbox' || interactiveEl.type === 'radio')) {
          playSound(interactiveEl.checked ? 'toggleOn' : 'toggleOff');
        } else if (
          interactiveEl.classList.contains('nav-item') ||
          interactiveEl.getAttribute('role') === 'tab' ||
          interactiveEl.classList.contains('tab-btn') ||
          interactiveEl.classList.contains('settings-nav-btn')
        ) {
          playSound('tab');
        } else if (
          interactiveEl.classList.contains('btn-danger') ||
          interactiveEl.classList.contains('delete-btn') ||
          interactiveEl.getAttribute('title')?.toLowerCase().includes('delete')
        ) {
          playSound('delete');
        } else if (
          interactiveEl.id === 'theme-toggle-btn' ||
          interactiveEl.classList.contains('theme-toggle-btn')
        ) {
          playSound('toggle');
        } else if (
          interactiveEl.classList.contains('refresh-btn') ||
          interactiveEl.getAttribute('title')?.toLowerCase().includes('refresh')
        ) {
          playSound('pop');
        } else if (interactiveEl.tagName === 'BUTTON' || interactiveEl.classList.contains('btn')) {
          playSound('pop');
        } else {
          playSound('click');
        }

        // Spawn visual particle burst for interactive elements
        if (visualsEnabled) {
          spawnBurst(x, y);
        }
      } else {
        // Subtle click effect on blank space
        if (visualsEnabled) {
          spawnSubtleRipple(x, y);
        }
      }
    };

    const spawnBurst = (x, y) => {
      // Expanding ripple
      ripplesRef.current.push({
        x,
        y,
        radius: 6,
        speed: 3.2,
        alpha: 0.7,
        decay: 0.038,
        lineWidth: 2.2,
        color: '#008a50'
      });

      ripplesRef.current.push({
        x,
        y,
        radius: 3,
        speed: 2.0,
        alpha: 0.5,
        decay: 0.045,
        lineWidth: 1.5,
        color: '#34d399'
      });

      // Particle spray
      const particleCount = 7 + Math.floor(Math.random() * 5);
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.8;
        const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          size: 2.8 + Math.random() * 2.4,
          color,
          alpha: 0.9,
          decay: 0.026 + Math.random() * 0.02
        });
      }

      startAnimation();
    };

    const spawnSubtleRipple = (x, y) => {
      ripplesRef.current.push({
        x,
        y,
        radius: 4,
        speed: 2.4,
        alpha: 0.35,
        decay: 0.045,
        lineWidth: 1.2,
        color: '#10b981'
      });
      startAnimation();
    };

    window.addEventListener('click', handleClick, { capture: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick, { capture: true });
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [visualsEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className="click-effects-canvas"
      aria-hidden="true"
    />
  );
}

