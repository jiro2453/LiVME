/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#78B159',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#6b7280',
          foreground: '#ffffff',
        },
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#78B159',
        background: '#ffffff',
        foreground: '#111827',
        card: {
          DEFAULT: '#f9fafb',
          foreground: '#111827',
        },
        success: '#78B159',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['IBM Plex Sans JP', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
      },
    },
  },
  plugins: [],
};
