import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          // Pure black base for premium feel; cards elevated through near-black greys.
          base: "#000000",
          surface: "#0d0d0d",
          elevated: "#161616",
          card: "#1c1c1c",
          hover: "#222222",
        },
        accent: {
          DEFAULT: "#C9953A",
          hover: "#D4A14F",
          muted: "#8A6824",
          glow: "rgba(201, 149, 58, 0.18)",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a8a8a8",
          muted: "#6e6e6e",
          "on-accent": "#0a0a0a",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.10)",
          subtle: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.18)",
          focus: "#C9953A",
        },
        glass: {
          // Navigation-layer translucent surfaces.
          DEFAULT: "rgba(255,255,255,0.04)",
          strong: "rgba(255,255,255,0.06)",
          highlight: "rgba(255,255,255,0.10)",
          border: "rgba(255,255,255,0.10)",
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
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
        pill: "9999px",
      },
      boxShadow: {
        // Soft depth shadows (deeper at distance, color-bleed accent for highlights).
        sm: "0 2px 6px rgba(0,0,0,0.4)",
        md: "0 10px 30px -10px rgba(0,0,0,0.55)",
        lg: "0 24px 50px -16px rgba(0,0,0,0.7)",
        xl: "0 40px 80px -24px rgba(0,0,0,0.85)",
        accent:
          "0 10px 32px -8px rgba(201,149,58,0.45), 0 0 0 1px rgba(201,149,58,0.4) inset",
        // Inner top highlight — specular for glass / glass-prominent surfaces
        "glass-edge":
          "inset 0 1px 0 0 rgba(255,255,255,0.16), inset 0 -1px 0 0 rgba(0,0,0,0.4)",
        "glass-edge-strong":
          "inset 0 1px 0 0 rgba(255,255,255,0.24), inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.4)",
      },
      letterSpacing: {
        btn: "0.06em",
        "btn-tight": "0.03em",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      backdropBlur: {
        xs: "4px",
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
