
import React, { useEffect, useRef } from 'react';
import { useStore } from '../context/Store';

export const Visualizer: React.FC<{ className?: string }> = ({ className }) => {
  const { analyser, visualizerMode } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const particles: {x: number, y: number, v: number, size: number}[] = [];

    // Initialize particles
    for(let i=0; i<50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            v: Math.random() * 2 + 1,
            size: Math.random() * 3
        });
    }

    const renderFrame = () => {
      animationIdRef.current = requestAnimationFrame(renderFrame);
      
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (displayWidth === 0 || displayHeight === 0) return;

      // Handle High DPI
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, displayWidth, displayHeight);
      }

      const width = displayWidth;
      const height = displayHeight;

      // Gradient
      const gradient = ctx.createLinearGradient(0, height, width, 0);
      gradient.addColorStop(0, '#06b6d4'); // cyan
      gradient.addColorStop(1, '#8b5cf6'); // violet
      ctx.fillStyle = gradient;
      ctx.strokeStyle = gradient;

      analyser.getByteFrequencyData(dataArray);

      if (visualizerMode === 'WAVE') {
          analyser.getByteTimeDomainData(dataArray);
          ctx.lineWidth = 2;
          ctx.beginPath();

          const sliceWidth = width * 1.0 / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 128.0;
              const y = v * height / 2;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              x += sliceWidth;
          }
          ctx.lineTo(width, height / 2);
          ctx.stroke();
      }
      else if (visualizerMode === 'CIRCLE') {
          const cx = width / 2;
          const cy = height / 2;
          const radius = Math.min(width, height) / 3;
          const bars = 60;
          const step = Math.floor(bufferLength / bars) || 1;

          ctx.lineWidth = 3;
          ctx.lineCap = 'round';

          for(let i=0; i<bars; i++) {
              const value = dataArray[i * step];
              const percent = value / 255;
              const barHeight = percent * (radius * 0.8);
              const angle = (i * 2 * Math.PI) / bars;
              
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(angle);
              
              ctx.beginPath();
              ctx.moveTo(0, radius);
              ctx.lineTo(0, radius + barHeight + 2);
              ctx.stroke();
              
              ctx.restore();
          }
      }
      else if (visualizerMode === 'MIRROR') {
          const bars = 40;
          const step = Math.floor(bufferLength / bars) || 1;
          const barWidth = (width / 2) / bars;

          for(let i=0; i<bars; i++) {
             const value = dataArray[i * step];
             const percent = value / 255;
             const barHeight = percent * height * 0.8;
             
             const xRight = (width / 2) + (i * barWidth);
             const xLeft = (width / 2) - ((i + 1) * barWidth);
             const y = (height - barHeight) / 2;

             ctx.fillRect(xRight, y, barWidth - 1, barHeight);
             ctx.fillRect(xLeft, y, barWidth - 1, barHeight);
          }
      }
      else if (visualizerMode === 'SPECTRUM') {
          const bars = 64;
          const step = Math.floor(bufferLength / bars) || 1;
          const barWidth = width / bars;
          
          for(let i=0; i<bars; i++) {
             const value = dataArray[i * step];
             const percent = value / 255;
             const barHeight = percent * height;
             
             // Rainbow hue
             const hue = (i / bars) * 360;
             ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
             
             ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
          }
      }
      else if (visualizerMode === 'PARTICLES') {
          // Calculate average volume
          let sum = 0;
          for(let i=0; i<bufferLength; i++) sum += dataArray[i];
          const avg = sum / bufferLength;
          const intensity = avg / 255;

          particles.forEach((p, i) => {
              p.y -= p.v + (intensity * 5);
              if (p.y < 0) {
                  p.y = height;
                  p.x = Math.random() * width;
              }
              
              const radius = p.size + (dataArray[i % 20] / 255) * 10;
              ctx.beginPath();
              ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + intensity * 0.5})`;
              ctx.fill();
          });
      }
      else if (visualizerMode === 'HEXAGON') {
          const cx = width / 2;
          const cy = height / 2;
          // Use low freq for bass pulse
          const bass = dataArray[10] / 255; 
          const radius = (Math.min(width, height) / 4) * (1 + bass * 0.5);
          
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
              const angle = (i * 2 * Math.PI) / 6;
              const x = cx + radius * Math.cos(angle);
              const y = cy + radius * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.lineWidth = 5 + bass * 10;
          ctx.strokeStyle = gradient;
          ctx.stroke();
          
          // Inner ripple
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
              const angle = (i * 2 * Math.PI) / 6;
              const r2 = radius * 0.6;
              const x = cx + r2 * Math.cos(angle);
              const y = cy + r2 * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = `rgba(139, 92, 246, ${bass})`;
          ctx.fill();
      }
      else {
          // BARS (Default)
          const bars = 50; 
          const step = Math.floor((bufferLength * 0.6) / bars) || 1; 
          const barWidth = width / bars;

          for(let i=0; i<bars; i++) {
             const value = dataArray[i * step];
             const percent = value / 255;
             const barHeight = Math.max(4, percent * height);
             
             // Revert to standard gradient
             ctx.fillStyle = gradient;
             ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
          }
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [analyser, visualizerMode]);

  return (
    <div className={`w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
