/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fe',
          100: '#e8ecfd',
          200: '#d5ddfc',
          300: '#b5c3fa',
          400: '#8ba0f6',
          500: '#637bf2', // Primary Nexora Blue
          600: '#435be7',
          700: '#3344d0',
          800: '#2a37ab',
          900: '#273187',
        },
        student: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        mentor: {
          50: '#faf5ff',
          500: '#a855f7', // Mentor Purple
          600: '#9333ea',
        },
        dark: {
          900: '#0b0f19',
          800: '#161c2d',
          700: '#222b40',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        }
      }
    },
  },
  plugins: [],
}
