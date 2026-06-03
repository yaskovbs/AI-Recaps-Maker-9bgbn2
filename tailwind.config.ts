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
        // shadcn/ui CSS variable colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Neon AI Dark design tokens
        neon: {
          cyan: '#00D4FF',
          purple: '#B24BF3',
          pink: '#FF3CAC',
        },
        // Legacy compat aliases — map old steampunk classes to new neon palette
        brass: {
          50:  'rgba(240,240,255,0.98)',
          100: 'rgba(240,240,255,0.95)',
          200: 'rgba(220,220,250,0.9)',
          300: 'rgba(190,190,230,0.75)',
          400: 'rgba(160,160,210,0.6)',
          500: 'rgba(130,130,190,0.55)',
          600: 'rgba(0,212,255,0.5)',
          700: 'rgba(0,212,255,0.3)',
          800: 'rgba(0,212,255,0.15)',
          900: 'rgba(0,212,255,0.08)',
        },
        copper: {
          300: 'rgba(0,212,255,0.8)',
          400: 'rgba(178,75,243,0.8)',
          500: 'rgba(178,75,243,0.6)',
          600: 'rgba(178,75,243,0.4)',
          700: 'rgba(178,75,243,0.2)',
          800: 'rgba(178,75,243,0.1)',
          900: 'rgba(178,75,243,0.05)',
        },
        steam: {
          600: 'rgba(0,212,255,0.15)',
          700: 'rgba(0,212,255,0.1)',
          800: 'rgba(15,15,30,0.8)',
          900: '#0a0a14',
          950: '#07070f',
        },
        cog: {
          600: 'rgba(178,75,243,0.4)',
          700: 'rgba(178,75,243,0.3)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        serif:   ['Syne', 'serif'],
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      backgroundImage: {
        'steampunk-gradient': 'linear-gradient(135deg, #0a0a14 0%, #0f0f24 50%, #0a0a14 100%)',
        'neon-gradient':      'linear-gradient(135deg, #00D4FF 0%, #B24BF3 100%)',
      },
      boxShadow: {
        'brass':      '0 0 20px rgba(0, 212, 255, 0.15), 0 4px 16px rgba(0,0,0,0.4)',
        'steam':      '0 4px 14px 0 rgba(0, 212, 255, 0.2)',
        'neon-cyan':  '0 0 20px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.15)',
        'neon-purple':'0 0 20px rgba(178, 75, 243, 0.4), 0 0 60px rgba(178, 75, 243, 0.15)',
        'inner-brass':'inset 0 2px 4px 0 rgba(0, 212, 255, 0.1)',
      },
      animation: {
        'spin-slow':       'spin 3s linear infinite',
        'pulse-slow':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':           'float 6s ease-in-out infinite',
        'fade-in':         'fade-in 0.5s ease-out',
        'slide-up':        'slide-up 0.5s ease-out',
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
