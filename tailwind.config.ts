import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        themeBg: "#2b2b2b",
        themePanel: "#2e2e2e",
        themeSide: "#262626",
        themeBar: "#353535",
        themeLine: "#404040",
        themeText: "#e6e6e6",
        themeDim: "#93939a",
        themeAccent: "#2f7bf2",
        themeAccentHover: "#4a8df6",
        themeCtl: "#1f1f1f",
      },
      container: {
        center: true,
      }
    },
  },
  plugins: [
    daisyui
  ],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#2f7bf2",
          "secondary": "#4a4a4a",
          "accent": "#2f6fe0",
          "neutral": "#1f1f1f",
          "base-100": "#2b2b2b",
          "base-200": "#262626",
          "base-300": "#1f1f1f",
          "base-content": "#e6e6e6",
          "info": "#2f7bf2",
          "success": "#32d74b",
          "warning": "#febc2e",
          "error": "#e5484d",
        },
      },
    ],
  },
}
