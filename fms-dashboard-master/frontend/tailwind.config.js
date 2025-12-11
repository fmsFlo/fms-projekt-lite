/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Corporate Professional Colors
        bg: {
          primary: '#0a0e14',
          secondary: '#13171f',
          card: '#1a1f2e',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        accent: {
          primary: '#4a90e2',
          success: '#0ea66e',
          warning: '#e3a008',
          danger: '#dc2626',
        },
        text: {
          primary: '#e5e7eb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        }
      },
      fontSize: {
        'display': '56px',
        'metric': '40px',
        'section': '13px',
        'label': '11px',
      },
      spacing: {
        'base': '16px',
      },
      borderRadius: {
        'card': '8px',
        'bar': '4px',
      }
    },
  },
  plugins: [],
}
