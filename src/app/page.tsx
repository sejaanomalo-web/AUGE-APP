import { Logo } from "@/components/shared/Logo";
import { LinkButton } from "@/components/ui/LinkButton";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-base">
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        {/* Logo — rises in first, then settles dead-center on the screen. */}
        <div
          className="animate-hero-rise"
          style={{ animationDelay: "0ms" }}
        >
          <Logo
            size="lg"
            className="text-[88px] sm:text-[112px] leading-none"
          />
        </div>

        {/* Brand line — fades up slightly after the logo. */}
        <p
          className="mt-6 max-w-[480px] text-body-lg sm:text-h3 text-text-secondary animate-hero-rise"
          style={{ animationDelay: "220ms" }}
        >
          Seja a sua melhor versão.
        </p>

        {/* CTAs — last to appear so the eye lands on them naturally. */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-xs sm:max-w-none sm:w-auto animate-hero-rise"
          style={{ animationDelay: "420ms" }}
        >
          <LinkButton
            href="/cadastro"
            variant="primary"
            size="cta"
            fullWidth
          >
            Começar agora
          </LinkButton>
          <LinkButton
            href="/login"
            variant="tertiary"
            size="md"
            fullWidth
          >
            Já tenho conta
          </LinkButton>
        </div>
      </main>

      <footer className="px-6 lg:px-10 py-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-caption text-text-muted text-center">
        © 2026 ꓥuge · Anômalo
      </footer>
    </div>
  );
}
