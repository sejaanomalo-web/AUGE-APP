import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { SplashDismiss } from "@/components/shared/SplashDismiss";
import "./globals.css";

// CSS crítico INLINE do splash de inicialização: pinta instantaneamente junto
// do HTML (sem esperar o CSS externo), eliminando a tela branca do cold start.
// Logo "ꓥuge" expande ao centro (scale 0.6→1) sobre o fundo do app (#080A0D),
// estilo WhatsApp/Chrome. Cores literais para não depender de variáveis.
const SPLASH_CSS = `
#auge-splash{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#080A0D;opacity:1;transition:opacity .45s ease;animation:augeSplashSafety .5s ease 4s forwards}
#auge-splash[data-hidden="true"]{opacity:0;pointer-events:none}
#auge-splash .auge-splash-mark{font-family:Inter,system-ui,-apple-system,sans-serif;font-weight:800;font-size:clamp(46px,15vw,76px);line-height:1;letter-spacing:-.01em;color:#B7FF2A;transform-origin:center;animation:augeSplashIn .7s cubic-bezier(.32,.72,0,1) both,augeSplashPulse 1.8s ease-in-out .7s infinite}
@keyframes augeSplashIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes augeSplashPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes augeSplashSafety{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion:reduce){#auge-splash .auge-splash-mark{animation:augeSplashIn .3s ease both}}
`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Splash screens do iOS (gerados por scripts/generate-splash.mjs). Sem isso, o
// PWA standalone mostra tela branca durante o boot; com isso, iOS exibe um
// splash de marca imediatamente. Portrait apenas (o app trava orientação).
const APPLE_SPLASH = [
  { url: "/splash/splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/splash/splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/splash/splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/splash/splash-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/splash/splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/splash/splash-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/splash/splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/splash/splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/splash/splash-1206x2622.png", media: "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/splash/splash-1320x2868.png", media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
];

export const metadata: Metadata = {
  title: "ꓥuge",
  description:
    "Cockpit de evolução física para personal trainers e alunos em acompanhamento.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ꓥuge",
    startupImage: APPLE_SPLASH,
  },
  // Next auto-detecta src/app/icon.png e src/app/apple-icon.png.
};

export const viewport: Viewport = {
  themeColor: "#080A0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        variables: {
          colorPrimary: "#B7FF2A",
          colorBackground: "#080A0D",
          colorInputBackground: "#12161C",
          colorInputText: "#F7F8FA",
          colorText: "#F7F8FA",
          colorTextSecondary: "#8A929E",
          colorNeutral: "#F7F8FA",
          borderRadius: "20px",
          fontFamily: "Inter, sans-serif",
        },
        elements: {
          formButtonPrimary:
            "bg-accent hover:bg-accent-hover text-text-on-accent rounded-pill normal-case font-bold",
          card: "bg-bg-surface border-border-subtle shadow-lg pulse-line",
          headerTitle: "text-text-primary",
          headerSubtitle: "text-text-secondary",
          socialButtonsBlockButton: "border-border hover:bg-bg-hover",
          formFieldInput: "bg-bg-elevated border-border-subtle text-text-primary",
          footerActionLink: "text-accent hover:text-accent-hover",
        },
      }}
    >
      <html
        lang="pt-BR"
        className={inter.variable}
        suppressHydrationWarning
      >
        <body className="font-sans bg-bg-base text-text-primary min-h-screen antialiased">
          {/* Splash de inicialização - primeiro nó do body, pinta na hora. */}
          <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
          <div id="auge-splash" aria-hidden="true">
            <span className="auge-splash-mark">ꓥuge</span>
          </div>
          <SplashDismiss />
          <ThemeProvider>
            <MotionProvider>
              <ToastProvider>{children}</ToastProvider>
            </MotionProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
