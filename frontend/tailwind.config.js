/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(224 71% 4%)",
        glass: {
          surface: "hsla(224 71% 7% / 0.6)",
          border: "hsla(255 255% 255% / 0.08)"
        },
        cyber: {
          cyan: "hsl(180 100% 50%)",
          purple: "hsl(270 100% 60%)"
        },
        trust: {
          safe: "hsl(142 70% 45%)",
          low: "hsl(217 91% 60%)",
          medium: "hsl(47 95% 55%)",
          high: "hsl(24 95% 53%)",
          critical: "hsl(0 84% 60%)"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
