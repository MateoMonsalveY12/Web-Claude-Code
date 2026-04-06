/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    './templates/**/*.html',
  ],
  theme: {
    screens: {
      'sm':  '700px',
      'md':  '1000px',
      'lg':  '1150px',
      'xl':  '1400px',
    },
    fontFamily: {
      sans:    ['Jost', 'system-ui', 'sans-serif'],
      display: ['"kudryashev-d-contrast"', 'sans-serif'],
      accent:  ['"Ethic New"', 'Georgia', 'serif'],
    },
    borderRadius: {
      DEFAULT: '0px',
      none:    '0px',
      sm:      '0px',
      md:      '0px',
      lg:      '0px',
      xl:      '0px',
      full:    '9999px',
    },
    extend: {
      colors: {
        brand: {
          black:  '#000000',
          white:  '#FFFFFF',
          gray:   '#F3F3F3',
          red:    '#E32C2B',
          border: '#E0E0E0',
        },
      },
      maxWidth: {
        container: '85rem',
      },
      letterSpacing: {
        heading: '0.02em',
        button:  '0.15em',
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
      aspectRatio: {
        '4/5':  '4 / 5',
        '3/4':  '3 / 4',
        '4/3':  '4 / 3',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('scrolled', '[data-scrolled="true"] &')
    }),
  ],
}
