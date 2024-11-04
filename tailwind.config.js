/** Extended colors/fonts conforming to https://www.hsph.harvard.edu/communications-guide/ */
/** Screen sizes based on https://www.hsph.harvard.edu/atrocity-prevention-lab/collaborators/ */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        harvard: {
          'chan-gray': '#595859',
          chocolate: '#422E1C',
          putty: '#D7D1CB',
          slate: '#8996a0',
        },
        red: {
          light: '#E5CAC9',
          DEFAULT: '#B55A5A',
          dark: '#9D474B',
        },
        green: {
          light: '#C9D0C0',
          DEFAULT: '#888D81',
          dark: '#5F6962',
        },
        shade: {
          '01': '#252727',
          '02': '#3D3D3D',
        },
        tint: {
          '01': '#D6D6D7',
          '02': '#F0F0F2',
        },
      },
    },
    fontFamily: {
      merriweather: ['Merriweather', 'sans-serif'],
      'proxima-nova': ['proxima-nova', 'sans-serif'],
    },
    screens: {
      md: '720px',
    },
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('not-last', '&:not(:last-child)')
    },
  ],
}
