/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mona Sans', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        viridian: {
          DEFAULT: '#204D3B',
          dark: '#153B2B',
          light: '#E9EEDF',
        },
        coral: {
          DEFAULT: '#B54025',
          hover: '#97351E',
          brand: '#B54025',
        },
        peach: '#FFF4ED',
        ds2: {
          canvas: '#F5F3ED',
          surface: '#FFFEF9',
          tertiary: '#E9ECE1',
          stroke: '#D8DBCF',
          ink: '#202922',
          secondary: '#656B62',
          muted: '#656B62',
          magenta: '#D91B5C',
          purple: '#7C3AED',
        }
      },
      borderRadius: {
        'ds2-6': '6px',
        'ds2-8': '8px',
        'ds2-12': '12px',
        'ds2-16': '16px',
        'ds2-20': '20px',
        'ds2-24': '24px',
        'ds2-28': '28px',
        'ds2-32': '32px',
        'ds2-48': '48px',
        'ds2-max': '9999px',
      },
      boxShadow: {
        'ds2-xs-border': '0 0 0 1px rgba(0, 0, 0, 0.08)',
        'ds2-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'ds2-lg-default': '0 12px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'ds2-footer': '0 -4px 20px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
};
