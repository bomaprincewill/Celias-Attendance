'use client'

import { useState, useEffect } from 'react'

type Phase = 'idle' | 'scanning' | 'success' | 'error'

interface Props {
  phase: Phase
  size?: number
}

export default function FingerprintScanner({ phase, size = 120 }: Props) {
  const color =
    phase === 'success' ? '#10b981' :
    phase === 'error'   ? '#ef4444' :
    phase === 'scanning'? '#16a34a' :
                          '#94a3b8'

  const glowColor =
    phase === 'success' ? 'rgba(16,185,129,0.3)' :
    phase === 'error'   ? 'rgba(239,68,68,0.3)' :
    phase === 'scanning'? 'rgba(22,163,74,0.3)' :
                          'transparent'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Pulse rings */}
      {phase === 'scanning' && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-40" />
          <div className="absolute inset-[-8px] rounded-full border border-green-300 animate-ping opacity-20"
               style={{ animationDelay: '0.3s' }} />
        </>
      )}
      {phase === 'success' && (
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-40" />
      )}

      {/* Main circle */}
      <div
        className="relative flex items-center justify-center rounded-full transition-all duration-500"
        style={{
          width: size,
          height: size,
          boxShadow: `0 0 ${phase !== 'idle' ? '32px' : '0px'} ${glowColor}`,
          background: phase === 'idle' ? '#f8fafc' : `${glowColor}`,
          border: `2px solid ${color}`,
          transition: 'all 0.4s ease',
        }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 64 64" fill="none">
          {/* Fingerprint paths */}
          <path d="M32 8C18.7 8 8 18.7 8 32" stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.4 : 1, transition: 'opacity 0.3s' }} />
          <path d="M56 32C56 18.7 45.3 8 32 8" stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.4 : 1, transition: 'opacity 0.3s', animationDelay: '0.1s' }} />
          <path d="M8 32C8 45.3 18.7 56 32 56" stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.4 : 1, transition: 'opacity 0.3s' }} />
          <path d="M32 56C45.3 56 56 45.3 56 32" stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.4 : 1, transition: 'opacity 0.3s' }} />
          {/* Inner rings */}
          <path d="M32 16C23.2 16 16 23.2 16 32C16 40.8 23.2 48 32 48" stroke={color} strokeWidth="2" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.5 : 1 }} />
          <path d="M32 16C40.8 16 48 23.2 48 32" stroke={color} strokeWidth="2" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.5 : 1 }} />
          <path d="M48 32C48 40.8 40.8 48 32 48" stroke={color} strokeWidth="2" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.5 : 1 }} />
          {/* Core rings */}
          <path d="M24 32C24 27.6 27.6 24 32 24C36.4 24 40 27.6 40 32" stroke={color} strokeWidth="2" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.6 : 1 }} />
          <path d="M40 32C40 36.4 36.4 40 32 40C27.6 40 24 36.4 24 36" stroke={color} strokeWidth="2" strokeLinecap="round"
            style={{ opacity: phase === 'idle' ? 0.6 : 1 }} />
          {/* Center dot */}
          <circle cx="32" cy="32" r="3" fill={color} style={{ opacity: phase === 'idle' ? 0.5 : 1 }} />

          {/* Scan line */}
          {phase === 'scanning' && (
            <line x1="8" y1="32" x2="56" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round"
              style={{
                animation: 'scan-line 1.4s ease-in-out infinite',
              }} />
          )}

          {/* Checkmark overlay */}
          {phase === 'success' && (
            <path d="M20 32L28 40L44 24" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'draw-check 0.4s ease-out forwards' }} />
          )}

          {/* X mark overlay */}
          {phase === 'error' && (
            <>
              <line x1="22" y1="22" x2="42" y2="42" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="42" y1="22" x2="22" y2="42" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-18px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(18px); opacity: 0; }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 50; stroke-dasharray: 50; }
          to { stroke-dashoffset: 0; stroke-dasharray: 50; }
        }
      `}</style>
    </div>
  )
}
