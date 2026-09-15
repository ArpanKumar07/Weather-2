import React, { useEffect, useRef } from 'react';

export default function WeatherEffects({ weatherGroup }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles array
    const particles = [];
    const count = weatherGroup === 'rain' ? 120 : weatherGroup === 'snow' ? 80 : 35;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 18 + 10,
        speed: weatherGroup === 'rain' ? Math.random() * 10 + 12 : Math.random() * 2 + 1,
        radius: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        drift: Math.random() * 2 - 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (weatherGroup === 'rain' || weatherGroup === 'storm') {
        // Raindrops
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
        ctx.lineWidth = 1.5;
        for (let p of particles) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.length);
          ctx.stroke();

          p.y += p.speed;
          p.x -= 1;
          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        }
      } else if (weatherGroup === 'snow') {
        // Snow flakes
        ctx.fillStyle = 'rgba(240, 249, 255, 0.65)';
        for (let p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speed;
          p.x += p.drift;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        }
      } else {
        // Ambient Solar Specks
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        for (let p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          p.y -= p.speed * 0.3;
          p.x += Math.sin(p.y * 0.02) * 0.5;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherGroup]);

  return <canvas ref={canvasRef} className="weather-canvas-effects" />;
}
