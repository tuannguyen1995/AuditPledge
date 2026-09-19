/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          base03: '#002B36',
          base02: '#073642',
          base01: '#586E75',
          base00: '#657B83',
          base0:  '#839496',
          base1:  '#93A1A1',
          base2:  '#EEE8D5',
          base3:  '#FDF6E3',
          yellow: '#B58900',
          orange: '#CB4B16',
          red:    '#DC322F',
          magenta:'#D33682',
          violet: '#6C71C4',
          blue:   '#268BD2',
          cyan:   '#2AA198',
          green:  '#859900',
        }
      },
      fontFamily: {
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}