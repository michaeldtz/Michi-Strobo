import React, { useEffect, useRef } from 'react';
import { AudioData } from '../hooks/useAudioAnalyzer';

interface VisualizerProps {
  audioData: AudioData | null;
  mode: 'pure' | 'cubic' | 'waves';
  sensitivity: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioData, mode, sensitivity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Initialize particles for Cubic mode
    if (mode === 'cubic' && particlesRef.current.length === 0) {
      const modernHues = [260, 180, 320, 20, 200];
      particlesRef.current = Array.from({ length: 45 }, () => {
        const hue = modernHues[Math.floor(Math.random() * modernHues.length)];
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 35 + 15,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          color: `hsl(${hue}, 90%, 60%)`,
          rotation: Math.random() * Math.PI * 2,
          rv: (Math.random() - 0.5) * 0.15
        };
      });
    }

    const render = () => {
      if (!audioData) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const { volume: rawVolume, bass: rawBass, mid: rawMid, treble: rawTreble, frequencyData, timeData } = audioData;
      
      const volume = Math.min(1, rawVolume * sensitivity);
      const bass = Math.min(1, rawBass * sensitivity);
      const mid = Math.min(1, rawMid * sensitivity);
      const treble = Math.min(1, rawTreble * sensitivity);

      if (mode === 'pure') {
        // Pure Strobe - High contrast flashes on bass hits
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; // Fade effect
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Subtle background pulse so it's not "dead"
        const pulseIntensity = volume * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Use a lower threshold for the flash
        if (bass > 0.5) {
          // Circulate colors based on time
          const hue = (Date.now() / 5) % 360;
          ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add some "glitch" lines on heavy hits
          if (bass > 0.8) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 15;
            for(let i=0; i<8; i++) {
              const y = Math.random() * canvas.height;
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
          }
        }
      } else if (mode === 'cubic') {
        // Cubic Mode - Floating cubes that pulse and bounce
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach(p => {
          // React to bass and volume
          const scale = 1 + bass * 1.5;
          p.x += p.vx * (1 + bass * 8);
          p.y += p.vy * (1 + bass * 8);
          p.rotation += p.rv * (1 + treble * 5);

          // Bounce with screen padding
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          // Color shifts with mid frequencies
          const hueShift = mid * 100;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 20 * bass;
          ctx.shadowColor = p.color;
          
          const s = p.size * scale;
          ctx.fillRect(-s / 2, -s / 2, s, s);
          
          // Wireframe overlay
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + bass * 0.7})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(-s / 2, -s / 2, s, s);
          
          // Inner glow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
          
          ctx.restore();
        });
      } else if (mode === 'waves') {
        // Waves Mode - Dynamic frequency ribbons
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const sliceWidth = canvas.width / (frequencyData.length / 2);
        const modernHues = [260, 180, 320, 20, 200];
        
        // Draw multiple layered waves
        for (let j = 0; j < modernHues.length; j++) {
          ctx.beginPath();
          const baseHue = modernHues[j];
          const hue = (baseHue + Math.sin(Date.now() * 0.001) * 20) % 360;
          ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.5 + bass * 0.5})`;
          ctx.lineWidth = 3 + volume * 20;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 15 * volume;
          ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`;
          
          let x = 0;
          for (let i = 0; i < frequencyData.length / 2; i++) {
            const v = frequencyData[i] / 128.0;
            const offset = Math.sin(i * 0.12 + Date.now() * 0.003 + j) * 120 * bass;
            const y = (canvas.height / 2) - (v * canvas.height / 4) + offset;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
          }
          ctx.stroke();
        }
        
        // Add a central "pulse" circle
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 50 + bass * 150, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${bass * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioData, mode, sensitivity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full bg-black"
      style={{ touchAction: 'none' }}
    />
  );
};
