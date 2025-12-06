import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
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
        // Ensuring numbers align perfectly in tables/lists
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // The "Soft Vivid Violet" Primary
        primary: {
          DEFAULT: "hsl(250, 95%, 65%)",
          foreground: "#ffffff",
          soft: "hsl(250, 95%, 96%)",
        },
        // The "Emerald" Secondary (Money/Success)
        secondary: {
          DEFAULT: "hsl(160, 84%, 39%)",
          foreground: "#ffffff",
          soft: "hsl(160, 84%, 96%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(215.4, 16.3%, 46.9%)",
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(222.2, 84%, 4.9%)",
        },
      },
      borderRadius: {
        lg: "16px", // Softer curves (Squircle-ish)
        md: "12px",
        sm: "8px",
      },
      boxShadow: {
        // The "Soft" shadow defined in your philosophy
        soft: "0 10px 40px -10px rgba(0,0,0,0.08)",
        glow: "0 0 20px -5px hsl(250, 95%, 65%, 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
