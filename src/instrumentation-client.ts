// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3cf9c9e2458b637caa7a6d9db4e274b9@o4511448505712640.ingest.us.sentry.io/4511448513052672",

  // Amostragem de traces em produção: 20% (era 100%).
  tracesSampleRate: 0.2,
  // Logs do cliente desligados: instrumentavam o console e geravam tráfego de
  // telemetria contínuo no mobile. Erros continuam via captureException.
  enableLogs: false,

  // Session Replay só em sessões COM erro (o que importa pra debugar). A
  // gravação contínua de 10% das sessões saudáveis foi desligada (custo de
  // CPU/upload no mobile sem benefício).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

// Session Replay carregado sob demanda APÓS o init: o código da integração
// (~50 kB gzip) sai do first-load JS de todas as rotas. Os sample rates acima
// continuam valendo; falha ao carregar (ex.: ad blocker) só perde telemetria.
Sentry.lazyLoadIntegration("replayIntegration")
  .then((replayIntegration) => {
    Sentry.addIntegration(replayIntegration());
  })
  .catch(() => {});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
