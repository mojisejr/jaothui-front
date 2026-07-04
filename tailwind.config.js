/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      mobileS: "375px",
      mobileM: "425px",
      tabletS: "768px",
      tabletM: "1024px",
      labtop: "1440px",
      desktop: "1920px",
      desktopM: "2330px",
    },
    colors: {
      thuiyellow: "#E3A51D",
      thuigray: "#323232",
      thuidark: "#0F0F0F",
      thuiwhite: "#fff",
    },
    // v2 dark-gold-green semantic layer — ADDITIVE (extend), consumes CSS vars from
    // styles/globals.css :root. Legacy `thui*` (above) + daisyUI theme stay untouched.
    extend: {
      colors: {
        // safety: theme.colors (above) replaced the default palette, so re-add the
        // keyword colors v2 components rely on.
        transparent: "transparent",
        current: "currentColor",
        white: "#ffffff",
        black: "#000000",
        // v2 semantic roles (consume CSS vars from globals.css :root)
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        accent: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        "border-soft": "var(--border-soft)",
      },
      borderRadius: {
        card: "var(--ref-radius-card)",
        pill: "var(--ref-radius-pill)",
      },
      boxShadow: {
        gold: "var(--ref-shadow-gold)",
      },
      backgroundImage: {
        "gradient-ring": "var(--gradient-ring)",
        "gradient-gold": "var(--gradient-gold)",
        "gradient-hero": "var(--gradient-hero)",
      },
      fontFamily: {
        sans: ["Prompt", "sans-serif"],
      },
    },
  },
  daisyui: {
    themes: [
      {
        theme: {
          primary: "#E3A51D",
          secondary: "#374151",
          accent: "#65a30d",
          neutral: "#1f2937",
          "base-100": "#f3f4f6",
          info: "#155e75",
          success: "#166534",
          warning: "#ea580c",
          error: "#dc2626",
        },
      },
    ],
  },

  plugins: [require("daisyui")],
};
