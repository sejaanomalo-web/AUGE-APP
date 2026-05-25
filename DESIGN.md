# Auge — Design System

Identidade visual e tokens para alinhar a landing page com o app Auge. Tudo neste documento é extraído direto de `tailwind.config.ts` e `src/app/globals.css`, então as cores, fontes e raios listados aqui são literalmente os mesmos que o app usa em produção. Toda decisão visual deve referenciar um token daqui, não inventar valores.

---

## 1. Marca

### Logo

- **Wordmark**: `ꓥuge` — escrito com o glifo U+A4E5 ("Lisu letter ngwa") como substituto do "A". É um triângulo invertido sem traço central, lembrando uma seta apontando pra cima — alinha com a ideia de "atingir o auge".
- **Fonte do wordmark**: Inter, weight 800 (extrabold), letter-spacing 0.
- **Cor do wordmark**: `accent` (verde-lima) sobre fundo escuro; `text-on-accent` sobre o próprio accent.
- **Tagline oficial**: _"Seja a sua melhor versão."_
- **Tamanhos**: sm = 23px, md = 31px, lg = 42px, e no hero da landing/welcome chega a 88-112px (`text-[88px] sm:text-[112px]`).
- **Arquivos**:
  - `logo-Auge-bg.png` — variante transparente (1080×1080, RGBA)
  - `logo-Auge.png` — variante com fundo escuro sólido (1080×1080, RGB)
  - Use a transparente como favicon e em qualquer composição; a com fundo só onde precisar de fallback opaco.

### Tom de voz

- Direto, segunda pessoa ("seu treino", "sua evolução").
- Português do Brasil, **sem em-dashes** (—). Use hífen (-) ou parênteses.
- Estilo "performance" sóbrio: nada de gritos publicitários, exclamações em excesso ou clichês fitness ("transforme sua vida!!!"). A voz é a de um personal experiente: confiante, técnica, próxima.
- Termos do produto em PT-BR: **treino**, **plano**, **avaliação física**, **evolução**, **personal**, **aluno**, **medidas**, **objetivos**.

---

## 2. Cores

Cores são guardadas em CSS variables com canais RGB (`R G B`) para permitir o modificador `<alpha-value>` do Tailwind. O app suporta dois temas (dark default, light opcional). A landing pode optar por usar **só o dark** — é o tema oficial da marca.

### 2.1 Tema escuro (canônico)

```css
/* Fundos */
--bg-base:     8 10 13;   /* #080A0D — obsidiana, fundo da página inteira */
--bg-surface:  18 22 28;  /* #12161C — cartões, blocos */
--bg-elevated: 23 28 35;  /* #171C23 — modais, headers, sidebar */
--bg-card:     18 22 28;  /* #12161C — alias de surface, usado em alguns wrappers */
--bg-hover:    37 43 51;  /* #252B33 — estado hover de superfícies */

/* Accent (verde-lima vibrante - cor primária da marca) */
--accent:        183 255 42;  /* #B7FF2A — botões primários, destaques, wordmark */
--accent-hover:  207 255 94;  /* #CFFF5E — hover de botões primários */
--accent-muted:   99 139 21;  /* #638B15 — pressed/active de botões primários */
--accent-glow:   rgba(183, 255, 42, 0.18); /* halo suave usado em sombras e gradientes */

/* Coach (azul-royal - tudo relacionado ao personal trainer) */
--coach:        29 78 216;  /* #1D4ED8 */
--coach-glow:   rgba(29, 78, 216, 0.22);

/* Intensity (laranja-fogo - alertas de execução, séries quentes, intensidade de treino) */
--intensity:        255 106 42; /* #FF6A2A */
--intensity-glow:   rgba(255, 106, 42, 0.18);

/* Texto */
--text-primary:   247 248 250; /* #F7F8FA - títulos, números, valores */
--text-secondary: 138 146 158; /* #8A929E - corpo, descrições */
--text-muted:      95 104 117; /* #5F6875 - legendas, metadados */
--text-on-accent:   8  10  13; /* #080A0D - texto sobre o verde-lima (preto) */

/* Bordas (alpha já embutido, não usa <alpha-value>) */
--border-default: rgba(37, 43, 51, 0.95);
--border-subtle:  rgba(37, 43, 51, 0.72);
--border-strong:  rgba(138, 146, 158, 0.24);
```

### 2.2 Tema claro (opcional)

```css
--bg-base:     255 255 255;
--bg-surface:  247 247 247;
--bg-elevated: 255 255 255;
--bg-card:     250 250 250;
--bg-hover:    240 240 240;

--accent:        48 128 0;   /* #308000 — verde mais escuro pra contrastar no branco */
--accent-hover:  38 107 0;
--accent-muted:  183 255 42; /* o verde-lima do dark vira "muted" no light */
--accent-glow:   rgba(48, 128, 0, 0.12);

--coach:      29 78 216;
--intensity: 207 74 17;       /* #CF4A11 — laranja mais fechado no light */

--text-primary:   18 18 18;   /* #121212 */
--text-secondary: 77 77 77;   /* #4D4D4D */
--text-muted:    124 124 124; /* #7C7C7C */
--text-on-accent: 255 255 255;

--border-default: rgba(0, 0, 0, 0.10);
--border-subtle:  rgba(0, 0, 0, 0.06);
--border-strong:  rgba(0, 0, 0, 0.18);
```

### 2.3 Cores semânticas (compartilhadas entre temas)

```css
error:    #FF3B3B   /* erros de validação, ações destrutivas */
warning:  #FFB020   /* avisos, status "pausado" */
success:  #39FF88   /* confirmações, status "ativo", metas batidas */
info:     #1D4ED8   /* mesma cor do coach - badges informativos */
```

### 2.4 Como aplicar (Tailwind)

Cores via classes utilitárias, com modificadores de alpha quando precisar transparência:

```html
<div class="bg-bg-surface text-text-primary border border-border-subtle">
<button class="bg-accent text-text-on-accent hover:bg-accent-hover">
<span class="text-accent/60">  <!-- accent a 60% -->
<div class="bg-accent/10 border border-accent/25"> <!-- chip de accent leve -->
```

---

## 3. Tipografia

### Família

**Inter** (Google Fonts) — uma família só pra tudo. Variable font com pesos disponíveis: 400, 500, 600, 700, 800.

```ts
import { Inter } from "next/font/google";
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
```

```css
font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
```

Antialiasing global: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`.

### Escala (tokens do Tailwind)

| Token              | Tamanho | Line-height | Weight | Uso típico                                        |
|--------------------|---------|-------------|--------|---------------------------------------------------|
| `micro`            | 10px    | 1.3         | 700    | Indicadores minúsculos, contadores micro          |
| `caption`          | 12px    | 1.4         | 500    | Legendas, metadados, hints de formulário          |
| `body`             | 14px    | 1.5         | 400    | Corpo padrão de texto                             |
| `body-lg`          | 16px    | 1.5         | 400    | Corpo destacado, labels grandes                   |
| `h3`               | 18px    | 1.3         | 600    | Subtítulos de seção                               |
| `h2`               | 20px    | 1.25        | 700    | Títulos de modal, cabeçalho de bloco              |
| `h1`               | 24px    | 1.2         | 800    | Títulos de página                                 |
| `display`          | 32px    | 1.1         | 800    | Display grande dentro do app                      |
| `hero-name`        | 42px    | 1.05        | 800    | Nome do usuário no hero do dashboard              |
| `hero-display`     | 56px    | 1.0         | 800    | Headline de hero (landing/welcome)                |
| `stat-medium`      | 36px    | 1.0         | 800    | Estatísticas secundárias                          |
| `stat-large`       | 48px    | 1.0         | 800    | Estatísticas principais                           |
| `stat-hero`        | 64px    | 0.95        | 800    | Número-herói (peso, volume, etc.)                 |
| `stat-label`       | 11px    | 1.2         | 700    | Labels de stats — uppercase, espacejado natural   |
| `training-value`   | 44px    | 1.0         | 800    | Valor de execução de treino                       |
| `training-exercise`| 26px    | 1.15        | 800    | Nome do exercício na tela de execução             |
| `training-cta`     | 18px    | 1.2         | 700    | CTA em telas de treino                            |
| `training-label`   | 16px    | 1.3         | 500    | Labels em telas de treino                         |

### Display vs body

Todos os tokens `display`, `stat-*`, `hero-*` e `training-value/exercise` usam **font-weight 800 (extrabold)**. É a "voz forte" da marca — números grandes, declarações de performance.

Texto corrido (`body`, `body-lg`, `caption`) fica em 400-500 pra leitura confortável.

### Tabular nums

Use a classe `.tnum` ou `.font-mono-num` em qualquer número que mude valor (timer, peso, contagem, %) para travar a largura dos dígitos e evitar layout shift:

```html
<span class="tnum">42</span>
<span class="font-mono-num">12.4 kg</span>
```

Equivalente CSS: `font-variant-numeric: tabular-nums; font-feature-settings: "tnum";`.

### Letter-spacing

Padrão: 0. A marca não usa tracking exagerado.

Botões: `tracking-btn` = 0 (tracking neutro mesmo em uppercase).

---

## 4. Raios (border-radius)

```css
sm:   4px    /* foco anel, detalhes minúsculos */
md:  10px    /* inputs, selects */
lg:  14px    /* cards pequenos */
xl:  20px    /* cards grandes, modais (na verdade rounded-2xl no app) */
2xl: 28px    /* hero cards, painéis grandes */
pill: 9999px /* botões, chips, badges - tudo arredondado total */
```

Convenção: **botões e badges sempre pill**. Cartões `xl` ou `2xl`. Inputs `md`.

---

## 5. Sombras

```css
/* Sombras de elevação */
sm:  0 2px 6px rgba(0,0,0,0.4)
md:  0 10px 30px -10px rgba(0,0,0,0.55)
lg:  0 24px 50px -16px rgba(0,0,0,0.7)
xl:  0 40px 80px -24px rgba(0,0,0,0.85)

/* Sombras coloridas - usadas em CTAs e cartões de destaque */
accent:    0 14px 36px -14px rgba(183,255,42,0.55), inset 0 0 0 1px rgba(183,255,42,0.34)
coach:     0 14px 36px -14px rgba(29,78,216,0.58),  inset 0 0 0 1px rgba(29,78,216,0.34)
intensity: 0 14px 36px -14px rgba(255,106,42,0.58), inset 0 0 0 1px rgba(255,106,42,0.34)

/* Glass edges - usadas em elementos com vidro fosco (header, modais) */
glass-edge:        inset 0 1px 0 0 rgba(255,255,255,0.16), inset 0 -1px 0 0 rgba(0,0,0,0.4)
glass-edge-strong: inset 0 1px 0 0 rgba(255,255,255,0.24), inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.4)
```

Sombras coloridas são pra elementos hero (CTAs primários, cartões com gradient). Sombras neutras (sm/md/lg/xl) para todo o resto.

### Profundidade ambient (do app)

Utilitárias custom em `globals.css` que dão "respiro" sem precisar especificar shadow toda hora:

```css
.surface-depth {
  /* sombra layered always-on - top highlight, contact, ambient float */
  box-shadow:
    inset 0 1px 0 0 rgba(255,255,255,0.04),
    inset 0 -1px 0 0 rgba(0,0,0,0.28),
    0 1px 2px rgba(0,0,0,0.32),
    0 10px 28px -10px rgba(0,0,0,0.48);
  transition: transform 280ms cubic-bezier(0.2,0.7,0.2,1), box-shadow 280ms cubic-bezier(0.2,0.7,0.2,1), border-color 220ms ease-out, background-color 220ms ease-out;
}
.surface-lift:hover { transform: translateY(-2px); }
.surface-press:active { transform: translateY(0) scale(0.992); transition-duration: 120ms; }
```

Use `.surface-depth .surface-lift` em qualquer cartão que deva flutuar levemente e reagir ao hover.

---

## 6. Vidro fosco (glass)

O app tem um sistema de "glass" estilo iOS pra overlays transitórios (modais, popovers, headers blurry). **NÃO usar em superfícies persistentes** (cartões fixos, sidebar, bottom nav) — empilhar glass mata hierarquia.

```css
.glass-subtle  { backdrop-filter: blur(20px) saturate(180%); background: var(--glass-bg-subtle); }
.glass-medium  { backdrop-filter: blur(32px) saturate(180%); background: var(--glass-bg-medium); }
.glass-strong  { backdrop-filter: blur(40px) saturate(200%); background: var(--glass-bg-strong); }
.glass-nav     { backdrop-filter: blur(18px) saturate(180%); background: var(--glass-bg-medium); }
```

O `saturate()` é o que dá o "feel iOS" — sem ele, vira só um cartão translúcido sem alma.

Tokens (dark):
```css
--glass-bg-subtle: rgba(18, 22, 28, 0.72);
--glass-bg-medium: rgba(8, 10, 13, 0.82);
--glass-bg-strong: rgba(8, 10, 13, 0.92);
```

---

## 7. Gradientes recorrentes

### Hero gradient (fundo de página)

Aplicado no `<html>` como background:

```css
background: radial-gradient(
  ellipse 90% 34% at 50% 0%,
  rgba(183, 255, 42, 0.06) 0%,
  rgba(8, 10, 13, 0) 64%
);
```

Um halo de accent quase imperceptível no topo da viewport. Dá sensação de "luz vinda de cima" sem distrair.

### Pulse line (linha gradiente no topo de cards)

Utilitária `.pulse-line` que adiciona uma linha de 1px no topo do elemento misturando coach (azul) com accent (verde):

```css
.pulse-line::before {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(var(--coach) / 0.75),
    rgb(var(--accent) / 0.9),
    transparent
  );
}
```

É a "assinatura visual" do app — quase todo cartão de destaque tem ela. Usar na landing em hero cards e blocos de feature.

### Grid lattice (fundo)

Linhas finas em grade de 40px, ultra-tênues (alpha 0.014 no dark, 0.020 no light). Aplicado em `.bg-bg-base`:

```css
background-image:
  linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
  linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
background-size: 40px 40px;
background-attachment: fixed;
```

---

## 8. Espaçamento e ritmo

Tailwind padrão (4px base). Convenções do app:

- Padding interno de cartões: `p-5` (20px) ou `p-6` (24px) em modais
- Gap entre cartões de uma lista: `gap-3` (12px)
- Espaço entre seções da página: `gap-6` ou `mb-6` a `mb-8`
- Page container: `max-w-3xl mx-auto` (768px) pra páginas de leitura, `max-w-5xl` (1024px) ou `max-w-6xl` (1152px) pra dashboards
- Header h-16 mobile, h-18 desktop
- Safe area: sempre respeitar `env(safe-area-inset-bottom)` em footers / bottom nav

---

## 9. Componentes-chave (referência)

### Botões

3 variantes principais + 3 especiais:

| Variante      | Cor              | Texto            | Uso                                          |
|---------------|------------------|------------------|----------------------------------------------|
| `primary`     | accent (verde)   | text-on-accent   | CTA principal (Comprar, Começar, Salvar)    |
| `secondary`   | bg-elevated      | text-primary     | Ação secundária (Cancelar, Voltar)          |
| `tertiary`    | transparent      | text-secondary   | Link disfarçado de botão                    |
| `destructive` | error 10%        | error            | Excluir, remover                            |
| `coach`       | coach (azul)     | white            | Ações de personal                           |
| `intensity`   | intensity (laranja) | white         | Ações de execução, intensidade              |

Tamanhos: `sm` (h-9), `md` (h-11), `lg` (h-12), `cta` (min-h-56).

Todos com `rounded-pill`, gradient sutil de highlight no topo (`from-white/20 to-transparent`), e hover com `translateY(-1px)` + sombra mais profunda.

### Cards (hero)

`HeroCard` — superfície de destaque com gradient leve de coach+accent radial, border subtle, shadow-lg, pulse-line, surface-depth + surface-lift. Intensidades: `subtle`, `medium` (default), `strong`.

### Badges

Pill com border, padding 2.5/1.5, font-weight 700, tamanho 11px uppercase. Variantes: `default` (accent), `info` (info), `success/concluido`, `warning/in_progress`, `pulado` (cinza), `erro`, `coach`, `intensity`, `new`.

---

## 10. Movimento

### Curvas de easing

- Padrão (UI reativa): `cubic-bezier(0.2, 0.7, 0.2, 1)` — surface lift/press, mudanças de estado.
- Hero entradas: `cubic-bezier(0.32, 0.72, 0, 1)` — logo rise da landing.
- Modais (framer-motion spring): `damping: 28, stiffness: 320, mass: 0.85`.

### Durações

- Cor / background / border: 200ms ease-out
- Transform de cartão: 280ms
- Modal enter/exit: spring (≈350ms equivalente)
- Hero rise: 720ms
- Transição de tema: 200ms

Sempre respeitar `@media (prefers-reduced-motion: reduce)` — o app zera animações nesse caso.

### Animações nomeadas (Tailwind)

`animate-shimmer`, `animate-pulse-dot`, `animate-pulse-strong`, `animate-slide-up`, `animate-fade-in`, `animate-hero-rise`.

---

## 11. Iconografia

**Lucide React** (`lucide-react`) — o set inteiro do app. Stroke-width padrão 1.75 (icones inativos) ou 2.5 (ativos). Tamanho típico: 14-22px.

Pra landing, manter a mesma família — não misturar Lucide com Heroicons / Phosphor / etc.

---

## 12. Imagery e fotografia

O app é todo digital (sem fotos), mas a landing vai precisar:

- **Estética**: fotografia escura, contraste forte, foco em movimento e treino. Não use stock fitness genérico (sorrisos brancos, paredes brancas, kettlebells coloridos). Foco em silhuetas, transpiração real, equipamento profissional.
- **Tratamento**: levemente desaturado (-10 a -20% saturação), grain sutil opcional, sombras profundas. O app vive na obsidiana, a landing deve respirar a mesma atmosfera.
- **Acento**: quando aparecer cor, é o accent verde-lima (em luz de fundo, em uma roupa, em um detalhe de equipamento).

---

## 13. Princípios de design (regras de bolso)

1. **Performance é o produto.** Tudo no app respira velocidade e força: pesos altos, contagens decisivas, gradientes que evocam ação. A landing deve transmitir isso, não calmaria spa.
2. **Sóbrio, não festivo.** Sem confetes, fogos, ícones piscando. Foco em hierarquia clara, números grandes, contraste deliberado.
3. **Verde-lima é precioso.** Use o `accent` com parcimônia — botão primário, número-herói, detalhe de marca. Saturar a tela de verde mata o impacto.
4. **Tipografia carrega a personalidade.** Inter 800 grande + Inter 400 pequeno. Não inventar família secundária.
5. **Bordas sutis, sombras profundas.** Borders quase invisíveis (`rgba(37,43,51,0.72)`); profundidade vem da sombra ambiente, não do contorno.
6. **Vidro só em movimento.** Glass é pra overlays. Superfície fixa = cor sólida com `surface-depth`.
7. **Animação serve à clareza.** Lift sutil no hover (-2px), press scale (0.992), entrada de modal com spring. Nada de carrossel infinito girando.
8. **Acessível por padrão.** Contraste AAA no texto principal sobre fundo escuro, focus-visible com anel accent, tudo navegável por teclado.

---

## 14. URLs canônicas

- **App**: deploy próprio (auge-app.vercel.app ou domínio definitivo). Sistema autenticado, gated por Clerk.
- **Landing**: deploy separado. Apresenta o produto e direciona pro checkout.
- **Checkout → app**: webhook de pagamento cria o usuário no app via Clerk; após pagamento, redireciona pra `/cadastro` ou direto pro `/login` do app.

Landing e app **nunca** compartilham código, schema ou actions. Compartilham apenas identidade visual — este documento.
