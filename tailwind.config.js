/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        'lumi-primary': '#762075',
        'lumi-primary-hover': '#5E195D',
        'lumi-label': '#C964C5',
        'lumi-label-alt': '#8B5CF6',
        'lumi-action': '#1D6FBF',
        'lumi-action-hover': '#1558A0',
        'dark-header': '#1F2937',
        'dark-background': '#111827',
        'dark-card': '#1F2937',
        lumi: {
          50: '#FBF3FB',
          100: '#F3E5F5',
          200: '#E1BEE7',
          300: '#CE93D8',
          400: '#9D4D9C',
          500: '#762075',
          600: '#5E195D',
          700: '#4A1448',
          800: '#3A0F39',
          900: '#260825',
        },
        ink: {
          900: '#13101B',
          950: '#0B0810',
        },
      },
      boxShadow: {
        soft: '0 4px 12px rgba(0,0,0,0.06)',
        glow: '0 20px 40px -8px rgba(118,32,117,0.35)',
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      gridTemplateAreas: {
        'layout-desktop': ['header header', 'sidebar main'],
      },
      gridTemplateColumns: {
        'layout-desktop': 'auto 1fr',
      },
      gridTemplateRows: {
        'layout-desktop': '4rem 1fr',
      },
    },
  },
  plugins: [require('@savvywombat/tailwindcss-grid-areas')],
};
