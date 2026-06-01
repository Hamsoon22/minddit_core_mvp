import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5ec",
          100: "#d8eacc",
          500: "#4a7a28",
          600: "#3b6120",
          700: "#2d5016",
          900: "#1a2f0c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
