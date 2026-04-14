import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        secondary: "var(--color-secondary)",
        main: "var(--color-main)",
        muted: "var(--color-muted)",
      },
      backgroundColor: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
      },
      textColor: {
        main: "var(--color-main)",
        muted: "var(--color-muted)",
      },
    },
  },
  plugins: [],
};
export default config;
