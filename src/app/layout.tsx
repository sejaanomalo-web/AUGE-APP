import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ꓥuge | Seja sua melhor versão",
  description:
    "App de treino para personal trainers e alunos sérios sobre evolução.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ꓥuge",
  },
  // Next auto-detecta src/app/icon.png e src/app/apple-icon.png.
};

export const viewport: Viewport = {
  themeColor: "#C9953A",
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
          colorPrimary: "#C9953A",
          colorBackground: "#181818",
          colorInputBackground: "#1f1f1f",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#b3b3b3",
          colorNeutral: "#ffffff",
          borderRadius: "8px",
          fontFamily: "Inter, sans-serif",
        },
        elements: {
          formButtonPrimary:
            "bg-accent hover:bg-accent-hover text-text-on-accent rounded-pill normal-case font-bold",
          card: "bg-bg-surface border-border-subtle shadow-md",
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
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
