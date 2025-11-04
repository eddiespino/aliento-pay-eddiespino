/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      // 🎨 Design tokens extraídos del login exitoso
      colors: {
        brand: {
          // Slate palette (base del sistema)
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          },
          // Sky palette (primary)
          sky: {
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          },
          // Emerald palette (accent)
          emerald: {
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#047857',
            700: '#065f46',
            800: '#064e3b',
            900: '#022c22',
          },
          // Purple for gradients
          purple: {
            400: '#a78bfa',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95',
          }
        }
      },
      
      // 🌈 Gradientes del sistema
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #0ea5e9, #10b981)',
        'brand-gradient-hover': 'linear-gradient(to right, #0284c7, #047857)',
        'brand-bg': 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
        'brand-glow': 'linear-gradient(to right, rgba(14, 165, 233, 0.2), rgba(139, 92, 246, 0.2), rgba(16, 185, 129, 0.2))',
      },
      
      // 💫 Efectos y blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      
      // 📏 Espaciado adicional
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // 🎬 Animaciones personalizadas
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      
      // ⚡ Keyframes para animaciones
      keyframes: {
        glow: {
          '0%': { opacity: '0.5', transform: 'scale(0.98)' },
          '100%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      
      // 🎯 Tamaños de fuente adicionales
      fontSize: {
        '2xs': '0.625rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      
      // 🔲 Border radius personalizado
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      
      // 🌟 Sombras personalizadas
      boxShadow: {
        'brand': '0 10px 15px -3px rgba(15, 23, 42, 0.3), 0 4px 6px -2px rgba(15, 23, 42, 0.15)',
        'brand-lg': '0 20px 25px -5px rgba(15, 23, 42, 0.4), 0 10px 10px -5px rgba(15, 23, 42, 0.2)',
        'brand-xl': '0 25px 50px -12px rgba(15, 23, 42, 0.5)',
        'glow-sm': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-md': '0 0 40px rgba(14, 165, 233, 0.4)',
        'glow-lg': '0 0 60px rgba(14, 165, 233, 0.5)',
      }
    },
  },
  plugins: [],
};
