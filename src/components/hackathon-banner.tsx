'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function HackathonBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('hackathon-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    } else {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem('hackathon-banner-dismissed', 'true');
  };

  if (!visible || dismissed) return null;

  return (
    <>
      <style jsx>{`
        @keyframes cyber-glow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.4),
                        0 0 30px rgba(0, 255, 255, 0.1),
                        inset 0 0 20px rgba(0, 255, 255, 0.05);
          }
          50% {
            box-shadow: 0 0 25px rgba(0, 255, 255, 0.6),
                        0 0 50px rgba(0, 255, 255, 0.2),
                        inset 0 0 30px rgba(0, 255, 255, 0.1);
          }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.8; }
          97% { opacity: 1; }
          98% { opacity: 0.6; }
        }
        .hackathon-float {
          animation: cyber-glow 3s ease-in-out infinite;
        }
        .hackathon-float::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(transparent 50%, rgba(0, 255, 255, 0.03) 50%);
          background-size: 100% 4px;
          pointer-events: none;
        }
        .hackathon-scanline {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 8px;
          background: linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.1), transparent);
          animation: scanline 3s linear infinite;
          pointer-events: none;
        }
        .hackathon-title {
          animation: flicker 4s infinite;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.8),
                       0 0 20px rgba(0, 255, 255, 0.4);
        }
      `}</style>
      <div
        className="hackathon-float fixed top-24 right-6 z-50 max-w-xs rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #0a0e1a 0%, #111833 50%, #0a0e1a 100%)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        }}
      >
        <div className="hackathon-scanline" />
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-3 text-cyan-400/60 hover:text-cyan-300 text-lg leading-none cursor-pointer z-10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-5 relative">
          <div
            className="text-[10px] uppercase tracking-[0.3em] mb-2"
            style={{ color: 'rgba(0, 255, 255, 0.6)' }}
          >
            // Virtual Hackathon
          </div>
          <div
            className="hackathon-title text-xl font-bold mb-2 font-mono"
            style={{ color: '#00ffff' }}
          >
            MCP_HACK//26
          </div>
          <p
            className="text-xs leading-relaxed mb-4"
            style={{ color: 'rgba(200, 210, 255, 0.7)' }}
          >
            Build with <span style={{ color: '#00ffff' }}>MCP</span> &amp;{' '}
            <span style={{ color: '#ff00ff' }}>AI Agents</span>.<br />
            $5,000 in prizes. Feb 2 &ndash; Mar 1, 2026.
          </p>
          <a
            href="https://aihackathon.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center text-sm font-bold rounded px-4 py-2.5 transition-all duration-200 uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            style={{
              background: 'linear-gradient(90deg, #00ffff, #00ccff)',
              color: '#0a0e1a',
              letterSpacing: '0.1em',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #00ffff, #ff00ff)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #00ffff, #00ccff)';
            }}
          >
            Register Now &rarr;
          </a>
        </div>
      </div>
    </>
  );
}
