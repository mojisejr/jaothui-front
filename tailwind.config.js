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
    extend: {
      animation: {
        scroll: "infinite-scroll 6s linear infinite",
      },
      keyframes: {
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
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
