import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          950: '#070812',
          900: '#0B0D1A',
          850: '#0F1022',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(120, 100, 255, 0.18), 0 10px 40px rgba(120, 100, 255, 0.12)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config

