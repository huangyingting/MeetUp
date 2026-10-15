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
        sans: ['NeuSans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        viridian: {
          DEFAULT: '#00798A',
          dark: '#005D6B',
          light: '#E6F4F6',
        },
        coral: {
          DEFAULT: '#F65858',
          hover: '#E04444',
          brand: '#E51937',
        },
        peach: '#FFF4ED',
        ds2: {
          canvas: '#FCFCFD',
          surface: '#FFFFFF',
          tertiary: '#F4F4F6',
          stroke: '#E5E7EB',
          ink: '#141416',
          secondary: '#52525B',
          muted: '#71717A',
          magenta: '#D91B5C',
          purple: '#7C3AED',
        }
      },
      borderRadius: {
        'ds2-6': '6px',
        'ds2-8': '8px',
        'ds2-12': '12px',
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
