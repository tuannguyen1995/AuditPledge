/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080C14',
          card: '#0D1424',
          surface: '#121D33',
          border: '#1E293B',
          'border-bright': '#334155',
          text: '#F1F5F9',
          muted: '#94A3B8',
          subtle: '#64748B',
        },
        neon: {
          cyan: '#06B6D4',
          'cyan-glow': 'rgba(6, 182, 212, 0.25)',
          emerald: '#10B981',
          'emerald-glow': 'rgba(16, 185, 129, 0.25)',
          crimson: '#EF4444',
          'crimson-glow': 'rgba(239, 68, 68, 0.25)',
          amber: '#F59E0B',
          'amber-glow': 'rgba(245, 158, 11, 0.25)',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}