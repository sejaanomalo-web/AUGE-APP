# AUGE — Plano de inicialização instantânea do PWA

**Data:** 2026-06-13
**Problema:** abrir o app instalado na tela inicial leva ~5s até a primeira tela. Meta: ~1s ou instantâneo, como apps nativos.

## Diagnóstico (causa raiz medida no código)

1. **Service worker usa `NetworkFirst` no `start-url`.** No `public/sw.js` gerado:
   `NetworkFirst({cacheName:"start-url"})` e `NetworkFirst` para `pages`/`pages-rsc`.
   Ao abrir o PWA, o SW **espera a rede** buscar `/` antes de pintar. Em 4G frio = ~5s.
   Isso vem do default `dynamicStartUrl: true` do `@ducanh2912/next-pwa`.
2. **`/` é 100% estático** (prerenderizado em `index.html`, 80KB) — logo PODE ser servido do cache instantaneamente. O `dynamicStartUrl: true` só faz sentido se o start_url variasse por sessão; não é o caso.
3. **iOS sem `apple-touch-startup-image`** mostra **tela branca** durante o boot do PWA (Android já usa `background_color`+ícone do manifest).
4. **Roteamento:** `start_url: "/"` renderiza a landing de marketing (logo + CTAs com animações até 420ms). Um usuário **logado** também cai nela e precisa navegar — não abre direto no app.

## Plano por camada

### Camada 1 — Service worker (a causa raiz)
`next.config.ts`: `dynamicStartUrl: false` (+ `cacheStartUrl: true`). Remove o `NetworkFirst` do start-url; `/` passa a ser **precacheado** e servido do cache → **paint instantâneo** no launch. Revalida em background. Risco baixo (start_url é estático).

### Camada 2 — Splash nativo iOS
- `scripts/generate-splash.mjs`: gera `public/splash/*.png` (glyph ꓥ dourado sobre #080A0D) para as resoluções de iPhone mais comuns.
- `src/app/layout.tsx`: `appleWebApp.startupImage: [{ url, media }]` apontando para os splashes, com media queries por device. iOS passa a mostrar splash de marca **imediatamente** no boot (some a tela branca). Aditivo, sem risco (device sem match só não mostra splash).

### Camada 3 — Abrir direto no app (como nativo)
- `src/components/shared/RedirectIfSignedIn.tsx` (client): se Clerk `isLoaded && isSignedIn`, `router.replace("/post-login")` (resolve role → home). Renderiza `null`.
- Montado na landing `/`. A página continua **estática** (componente client não força dynamic), então o shell ainda é servido do cache instantâneo; o redirect acontece após hidratar. Deslogado: landing intacta.

### Camada 4 — Primeira tela do app instantânea
- `loading.tsx` (Suspense fallback / skeleton) em `/hoje`, `/dashboard`, `/nutri/dashboard` (as 3 home por papel = destino do launch) e um splash em `/post-login`. A navegação **commita na hora** mostrando skeleton enquanto o conteúdo streama, em vez de tela congelada.

### Fluxo final (usuário logado, app já instalado)
1. Toca no ícone → iOS mostra splash de marca **instantâneo** (camada 2).
2. SW serve `/` do precache → shell pinta **<1s** (camada 1).
3. Clerk hidrata → redireciona para `/post-login` → home do papel (camada 3).
4. Home mostra **skeleton instantâneo** e streama o conteúdo (camada 4).

## Validação
- `npm run build` verde; `tsc` 0 erros.
- Conferir no `public/sw.js` gerado que o `NetworkFirst({cacheName:"start-url"})` sumiu (start_url agora no precache).
- Sem mudança de comportamento para deslogado; logado passa a abrir direto no app (era a intenção).
