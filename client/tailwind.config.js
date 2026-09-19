/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        heritage: {
          green: "#087F5B",
          forest: "#064E3B",
          saffron: "#F97316",
          gold: "#F4B942",
          cream: "#FFF8EA",
          sand: "#F3E4C7",
          brown: "#5C2E16",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 16px 45px rgba(92,46,22,.10)",
        soft: "0 8px 24px rgba(6,78,59,.10)",
      },
      backgroundImage: {
        "heritage-pattern":
          "radial-gradient(circle at 1px 1px, rgba(92,46,22,.10) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
