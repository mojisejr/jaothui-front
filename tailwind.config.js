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
    colors: {
      thuiyellow: "#E3A51D",
      thuigray: "#323232",
      thuidark: "#1E1E1E",
      thuiwhite: "#fff",
    },
    extend: {},
  },
  plugins: [],
};
