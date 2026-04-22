import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/renderer/src/**/*.{ts,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif']
      },
      colors: {
        // Alpine dark palette
        alpine: {
          50: '#f5f3ec',
          100: '#e8e3d0',
          200: '#cfc89e',
          300: '#b5aa6e',
          400: '#d4a24a', // golden lantern — primary accent
          500: '#c08a2d',
          600: '#9a6e1e',
          700: '#7a5418',
          800: '#5c3e12',
          900: '#3d290b'
        },
        forest: {
          50: '#f0f2eb',
          100: '#d8dec9',
          200: '#b3bf9a',
          300: '#8ea06b',
          400: '#8ea86b', // moss green — secondary accent
          500: '#6b8450',
          600: '#4e6338',
          700: '#364627',
          800: '#252920', // surface
          900: '#1a1c14'  // background
        },
        stone: {
          50: '#f4f3f0',
          100: '#e2e0da',
          200: '#c8c5bc',
          300: '#aeaaa0',
          400: '#9c9784', // muted text
          500: '#7d7868',
          600: '#5e5a4f',
          700: '#403d36',
          800: '#2f3228', // raised surface
          900: '#1a1c14'
        },
        verein: '#6fa8dc',   // cool blue
        privat: '#e8997a',   // warm terracotta
        // shadcn/ui compatible tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 2s infinite linear'
      },
      backgroundImage: {
        'wood-grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")"
      }
    }
  },
  plugins: [animate]
}

export default config
