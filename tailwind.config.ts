import type { Config } from "tailwindcss";

const config: Config = {
  // `dark:` utilities follow the in-app theme setting (html.dark), not the OS
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Figma design tokens
        cream: "#F5F2ED",
        "green-deep": "#2D5016",
        "green-card": "#EAF0E3",
        "green-progress": "#4A7C3F",
        "lavender-card": "#EDE9F5",
        "peach-card": "#F5EDE9",
        "blue-card": "#E9EFF5",
        "yellow-card": "#F5F2E3",
        "tag-green": "#3D6B35",
        "tag-green-bg": "#E8F0E5",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
