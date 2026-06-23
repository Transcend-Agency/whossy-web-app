/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        red: "#F2243E",
        gray: "#8A8A8E",
        lightgray: "#F6F6F6",
        white: "#FFFFFF",
        yellow: "#FDFAE7",
      },
      fontSize:{
        '7.5xl': ['88px','92px']
      },
      fontFamily: {
        'neue-montreal': ["Neue Montreal", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
