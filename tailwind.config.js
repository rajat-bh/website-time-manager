/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts}",
    "./dist/**/*.html",
    "./*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace']
      },
      colors: {
        'extension': {
          'primary': '#007bff',
          'secondary': '#6c757d',
          'success': '#28a745',
          'danger': '#dc3545',
          'warning': '#ffc107',
          'info': '#17a2b8',
          'light': '#f8f9fa',
          'dark': '#343a40'
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-20px) scale(0.95)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        },
        slideInRight: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0)'
          }
        }
      }
    },
  },
  plugins: [],
} 