import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0B1020',
        accent: '#7C3AED'
      }
    }
  },
  plugins: []
};

export default config;
