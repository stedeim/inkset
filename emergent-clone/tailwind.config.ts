import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emergent-inspired dark palette with violet/indigo accent
        ink: {
          950: "#08080b",
          900: "#0c0c11",
          850: "#101017",
          800: "#15151f",
          700: "#1c1c29",
          600: "#26263a",
        },
        line: "#26263a",
        brand: {
          50: "#f3f1ff",
          100: "#e9e5ff",
          200: "#d6cfff",
          300: "#b6a8ff",
          400: "#9277ff",
          500: "#7c5cff",
          600: "#6a3ff5",
          700: "#5a2fd6",
          800: "#4a28ac",
          900: "#3d248a",
        },
        accent: {
          teal: "#2dd4bf",
          amber: "#fbbf24",
          pink: "#f472b6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        blink: "blink 1s step-end infinite",
        float: "float 6s ease-in-out infinite",
      },
      backgroundImage: {
        "grid-dark":
          "linear-gradient(to right, rgba(124,92,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,92,255,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
