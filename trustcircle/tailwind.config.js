/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
      },
      colors: {
        void: '#050508',
        surface: '#0c0c14',
        panel: '#12121e',
        border: '#1e1e2e',
        muted: '#2a2a3e',
        subtle: '#404058',
        dim: '#6b6b8a',
        ghost: '#9898b8',
        silver: '#c8c8d8',
        white: '#f0f0f8',
        trust: '#4fffb0',
        'trust-dim': '#1a6645',
        signal: '#ff6b35',
        'signal-dim': '#6b2d14',
        violet: '#8b5cf6',
        'violet-dim': '#3b1f6b',
        sky: '#38bdf8',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-trust': 'pulseTrust 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseTrust: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79, 255, 176, 0.3)' },
          '50%': { boxShadow: '0 0 0 12px rgba(79, 255, 176, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%': { textShadow: '0 0 10px rgba(79,255,176,0.3)' },
          '100%': { textShadow: '0 0 30px rgba(79,255,176,0.8), 0 0 60px rgba(79,255,176,0.3)' },
        },
      },
    },
  },
  plugins: [],
}
