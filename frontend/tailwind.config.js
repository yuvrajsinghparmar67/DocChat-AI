/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Inter"',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // Neutral scale tuned to feel like macOS/iOS surfaces rather than
        // generic Tailwind gray — slightly warmer, higher contrast at the
        // extremes, softer in the middle.
        surface: {
          light: '#FFFFFF',
          subtle: '#F5F5F7',
          muted: '#EDEDF3',
          dark: '#0C1118',
          darkSubtle: '#161B22',
          darkMuted: '#242A33',
        },
        accent: {
          DEFAULT: '#7C5CFF',
          hover: '#9378FF',
          soft: '#F1EEFF',
          softDark: 'rgba(124,92,255,0.18)',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.5rem',
        chat:'2rem'
      },
      boxShadow: {
        soft: '0 4px 18px rgba(0,0,0,0.10)',
        softDark: '0 6px 20px rgba(0,0,0,0.35)',
        glow: '0 0 0 12px rgba(0,149,246,0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
          '40%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
