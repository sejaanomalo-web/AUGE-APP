import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#121212",
          surface: "#181818",
          elevated: "#1f1f1f",
          card: "#252525",
          hover: "#2a2a2a",
        },
        accent: {
          DEFAULT: "#C9953A",
          hover: "#B8842E",
          muted: "#8A6824",
          glow: "rgba(201, 149, 58, 0.15)",
        },
        text: {
          primary: "#ffffff",
          secondary: "#b3b3b3",
          muted: "#7c7c7c",
          "on-accent": "#121212",
        },
        border: {
          DEFAULT: "#4d4d4d",
          subtle: "#2a2a2a",
          focus: "#C9953A",
        },
        error: "#f3727f",
        warning: "#ffa42b",
        success: "#1ed760",
        info: "#539df5",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        micro: ["10px", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        h3: ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        h2: ["20px", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        h1: ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        display: ["32px", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "training-label": ["16px", { lineHeight: "1.3", fontWeight: "500" }],
        "training-cta": ["18px", { lineHeight: "1.2", fontWeight: "700" }],
        "training-exercise": ["22px", { lineHeight: "1.2", fontWeight: "700" }],
        "training-value": ["36px", { lineHeight: "1", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      boxShadow: {
        sm: "0 2px 4px rgba(0,0,0,0.2)",
        md: "0 8px 8px rgba(0,0,0,0.3)",
        lg: "0 8px 24px rgba(0,0,0,0.5)",
        accent: "0 0 24px rgba(201, 149, 58, 0.2)",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        "pulse-dot": "pulseDot 1.5s ease-in-out infinite",
        "slide-up": "slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
