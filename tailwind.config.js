import colors from 'tailwindcss/colors'

/** Extended colors/fonts conforming to https://www.hsph.harvard.edu/communications-guide/ */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      white: colors.white,
      crimson: '#A51C30',
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
      redwood: {
        light: '#F2C7B5',
        DEFAULT: '#C66D5D',
        dark: '#AD4B45',
      },
      orange: {
        light: '#FDD1B6',
        DEFAULT: '#CA8260',
        dark: '#B36753',
      },
      green: {
        light: '#C9D0C0',
        DEFAULT: '#888D81',
        dark: '#5F6962',
      },
      purple: {
        light: '#D5BFD1',
        DEFAULT: '#80637A',
        dark: '#655573',
      },
      mauve: {
        light: '#E6C5C8',
        DEFAULT: '#AC8080',
        dark: '#94676E',
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
    fontFamily: {
      merriweather: ['Merriweather', 'sans-serif'],
      'proxima-nova': ['proxima-nova', 'sans-serif'],
    },
  },
  plugins: [],
}
