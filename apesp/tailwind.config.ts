import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["var(--font-fraunces)", ...fontFamily.serif],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
          dark: "hsl(var(--primary-dark))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          soft: "hsl(var(--secondary-soft))",
          dark: "hsl(var(--secondary-dark))",
          light: "hsl(var(--secondary-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          soft: "hsl(var(--destructive-soft))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          pink: "hsl(var(--accent-pink))",
          yellow: "hsl(var(--accent-yellow))",
          blue: "hsl(var(--accent-blue))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          red: {
            DEFAULT: "#A90E02",
            10: "#F2DBD9",
            25: "#E5B7B3",
            40: "#D48680",
            60: "#C3564E",
            80: "#B63228",
            s20: "#870B02",
            s40: "#650801",
            s60: "#440601",
            s80: "#220300",
          },
          lemon: {
            DEFAULT: "#FFFACD",
            s20: "#CCC8A4",
            s40: "#99967B",
            s60: "#666452",
          },
          cream: "#FFFDF8",
          ink: "#1A0C08",
          body: "#3A2420",
          border: "#E8DED2",
        },
        // Category Colors
        cat: {
          dining: "hsl(var(--cat-dining))",
          travel: "hsl(var(--cat-travel))",
          shopping: "hsl(var(--cat-shopping))",
          entertainment: "hsl(var(--cat-entertainment))",
          groceries: "hsl(var(--cat-groceries))",
          transport: "hsl(var(--cat-transport))",
          health: "hsl(var(--cat-health))",
          utilities: "hsl(var(--cat-utilities))",
          general: "hsl(var(--cat-general))",
        },
      },
      boxShadow: {
        glow: "0 14px 40px -20px rgba(169, 14, 2, 0.45)",
        card: "0 14px 35px -24px rgba(34, 3, 0, 0.28)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
