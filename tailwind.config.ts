import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        hand: ["Caveat", "Kalam", "cursive"],
        serif: ["Archivo Black", "Space Grotesk", "sans-serif"],
        display: ["Archivo Black", "sans-serif"],
        sans: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        marker: ["Architects Daughter", "Caveat", "cursive"],
      },
      boxShadow: {
        "brutal-sm": "2px 2px 0 0 hsl(var(--foreground))",
        brutal: "4px 4px 0 0 hsl(var(--foreground))",
        "brutal-lg": "6px 6px 0 0 hsl(var(--foreground))",
        "brutal-xl": "8px 8px 0 0 hsl(var(--foreground))",
        "brutal-primary": "4px 4px 0 0 hsl(var(--primary))",
        "brutal-accent": "4px 4px 0 0 hsl(var(--accent))",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%,100%": { boxShadow: "4px 4px 0 0 hsl(var(--foreground))" },
          "50%": { boxShadow: "6px 6px 0 0 hsl(var(--primary))" },
        },
        "press-down": {
          "0%": { transform: "translate(0,0)", boxShadow: "4px 4px 0 0 hsl(var(--foreground))" },
          "100%": { transform: "translate(2px,2px)", boxShadow: "2px 2px 0 0 hsl(var(--foreground))" },
        },
        "shake-x": {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-3px)" },
          "75%": { transform: "translateX(3px)" },
        },
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.985)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "bounce-soft": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "slide-up-fade": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "press-down": "press-down 0.12s ease forwards",
        "shake-x": "shake-x 0.4s ease",
        "page-in": "page-in 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
        "pop-in": "pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-soft": "bounce-soft 1.6s ease-in-out infinite",
        "slide-up-fade": "slide-up-fade 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
