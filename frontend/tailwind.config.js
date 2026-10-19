/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#080f1c', panel: '#101c2c', panel2: '#132238', border: '#22344a', cyan: '#39c9ed', muted: '#8da2bb' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { glow: '0 0 28px rgba(35, 180, 224, .10)' },
    },
  }, plugins: [],
};
