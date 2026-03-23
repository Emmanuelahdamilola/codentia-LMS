import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8A70D6',
          dark: '#6B52B8',
          light: '#F0EAFF',
          tint: '#E9E3FF',
        },
        codentia: {
          bg: '#FBFBFB',
          text: '#424040',
          muted: '#8A8888',
          border: '#E8E4F0',
        },
      },
      fontFamily: {
        lato: ['Lato', 'sans-serif'],
        code: ['Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(138,112,214,0.15), 0 1px 3px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

export default config