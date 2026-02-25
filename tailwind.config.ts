import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'couplet-red': '#DC2626',
        'couplet-dark-red': '#991B1B',
        'couplet-gold': '#F59E0B',
        'couplet-light-gold': '#FCD34D',
      },
      fontFamily: {
        cartoon: ['Comic Sans MS', 'Chalkboard SE', 'sans-serif'],
      },
      animation: {
        'wiggle': 'wiggle 0.3s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pop-in': 'popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'unroll': 'unroll 0.8s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        unroll: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
