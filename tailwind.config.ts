import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // RGB-channel CSS vars enable Tailwind alpha modifiers
        // (e.g. bg-accent/15) while still switching by theme.
        bg: {
          base: "rgb(var(--bg-base) / <alpha-value>)",
          surface: "rgb(var(--bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          card: "rgb(var(--bg-card) / <alpha-value>)",
          hover: "rgb(var(--bg-hover) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          muted: "rgb(var(--accent-muted) / <alpha-value>)",
          glow: "var(--accent-glow)",
        },
        intensity: {
          DEFAULT: "rgb(var(--intensity) / <alpha-value>)",
          glow: "var(--intensity-glow)",
        },
        coach: {
          DEFAULT: "rgb(var(--coach) / <alpha-value>)",
          glow: "var(--coach-glow)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          "on-accent": "rgb(var(--text-on-accent) / <alpha-value>)",
        },
        border: {
          // Borders use baked alpha rgba values — no opacity modifiers needed.
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          focus: "rgb(var(--accent) / <alpha-value>)",
        },
        glass: {
          DEFAULT: "var(--glass-bg-medium)",
          subtle: "var(--glass-bg-subtle)",
          strong: "var(--glass-bg-strong)",
          border: "var(--glass-border)",
        },
        // Semantic colors are theme-agnostic.
        error: "#FF3B3B",
        warning: "#FFB020",
        success: "#39FF88",
        info: "#1D4ED8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        micro: ["10px", { lineHeight: "1.3", letterSpacing: "0", fontWeight: "700" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        h3: ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        h2: ["20px", { lineHeight: "1.25", letterSpacing: "0", fontWeight: "700" }],
        h1: ["24px", { lineHeight: "1.2", letterSpacing: "0", fontWeight: "800" }],
        display: ["32px", { lineHeight: "1.1", letterSpacing: "0", fontWeight: "800" }],
        "stat-hero": ["64px", { lineHeight: "0.95", letterSpacing: "0", fontWeight: "800" }],
        "stat-large": ["48px", { lineHeight: "1", letterSpacing: "0", fontWeight: "800" }],
        "stat-medium": ["36px", { lineHeight: "1", letterSpacing: "0", fontWeight: "800" }],
        "stat-label": ["11px", { lineHeight: "1.2", letterSpacing: "0", fontWeight: "700" }],
        "hero-display": ["56px", { lineHeight: "1", letterSpacing: "0", fontWeight: "800" }],
        "hero-name": ["42px", { lineHeight: "1.05", letterSpacing: "0", fontWeight: "800" }],
        "training-label": ["16px", { lineHeight: "1.3", fontWeight: "500" }],
        "training-cta": ["18px", { lineHeight: "1.2", fontWeight: "700" }],
        "training-exercise": ["26px", { lineHeight: "1.15", letterSpacing: "0", fontWeight: "800" }],
        "training-value": ["44px", { lineHeight: "1", letterSpacing: "0", fontWeight: "800" }],
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
        sm: "0 2px 6px rgba(0,0,0,0.4)",
        md: "0 10px 30px -10px rgba(0,0,0,0.55)",
        lg: "0 24px 50px -16px rgba(0,0,0,0.7)",
        xl: "0 40px 80px -24px rgba(0,0,0,0.85)",
        accent:
          "0 14px 36px -14px rgba(183,255,42,0.55), 0 0 0 1px rgba(183,255,42,0.34) inset",
        coach:
          "0 14px 36px -14px rgba(29,78,216,0.58), 0 0 0 1px rgba(29,78,216,0.34) inset",
        intensity:
          "0 14px 36px -14px rgba(255,106,42,0.58), 0 0 0 1px rgba(255,106,42,0.34) inset",
        "glass-edge":
          "inset 0 1px 0 0 rgba(255,255,255,0.16), inset 0 -1px 0 0 rgba(0,0,0,0.4)",
        "glass-edge-strong":
          "inset 0 1px 0 0 rgba(255,255,255,0.24), inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.4)",
      },
      letterSpacing: {
        btn: "0",
        "btn-tight": "0",
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
        "pulse-strong": "pulseStrong 600ms ease-out",
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
        pulseStrong: {
          "0%, 100%": { transform: "scale(1.1)" },
          "50%": { transform: "scale(1.25)" },
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
