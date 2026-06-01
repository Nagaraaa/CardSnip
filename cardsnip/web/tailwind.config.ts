import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#07070a",
        panel: "#111118",
        violetNeon: "#a855f7",
      },
      boxShadow: {
        glow: "0 0 36px rgba(168, 85, 247, 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
