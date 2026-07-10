import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', '../../packages/compartilhado/src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
