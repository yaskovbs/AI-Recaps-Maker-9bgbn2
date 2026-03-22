import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Steampunk color palette
        brass: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d8bf',
          300: '#e8bc94',
          400: '#dd9867',
          500: '#d47c47',
          600: '#c6653c',
          700: '#a54f33',
          800: '#854130',
          900: '#6c3729',
        },
        copper: {
          50: '#fdf6f3',
          100: '#fae9e1',
          200: '#f5d0c2',
          300: '#ecaf99',
          400: '#e08467',
          500: '#d66445',
          600: '#c64e34',
          700: '#a53e2b',
          800: '#883528',
          900: '#713025',
        },
        steam: {
          50: '#f4f7fb',
          100: '#e8eff6',
          200: '#ccdceb',
          300: '#a0bedb',
          400: '#6d9bc6',
          500: '#4b7db0',
          600: '#396394',
          700: '#2f4f78',
          800: '#2a4464',
          900: '#273954',
        },
        cog: {
          50: '#f6f6f4',
          100: '#e7e7e3',
          200: '#d1d0c8',
          300: '#b3b2a7',
          400: '#959389',
          500: '#7d7c71',
          600: '#656461',
          700: '#535250',
          800: '#474645',
          900: '#3d3d3c',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'steampunk-gradient': 'linear-gradient(135deg, #2a4464 0%, #713025 50%, #854130 100%)',
        'brass-gradient': 'linear-gradient(135deg, #c6653c 0%, #e8bc94 100%)',
        'steam-texture': "url('/assets/steam-texture.png')",
      },
      boxShadow: {
        'brass': '0 4px 14px 0 rgba(212, 124, 71, 0.39)',
        'steam': '0 4px 14px 0 rgba(75, 125, 176, 0.39)',
        'inner-brass': 'inset 0 2px 4px 0 rgba(212, 124, 71, 0.2)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
