import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        luxury: {
          black: "#0A0A0A",
          gray: "#1A1A1A",
          gold: "#BFA181",
          silver: "#E5E5E5",
          accent: "#2A2A2A",
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
