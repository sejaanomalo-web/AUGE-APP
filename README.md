# ꓥuge App

App de treino para personal trainers e alunos. Atinja seu auge.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v3 com tokens do design system AUGE
- shadcn/ui (base), lucide-react, recharts, date-fns
- Fase 1: estático com mock data (sem backend)

## Desenvolvimento

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
├── app/
│   ├── (public)/    # landing, login, cadastro, onboarding
│   ├── (aluno)/     # hoje, treino, executar, histórico, medidas, evolução, perfil
│   ├── (personal)/  # dashboard, alunos, treinos, exercícios, perfil
│   └── ...
├── components/      # ui, aluno, personal, shared
├── lib/             # mock-data, utils, types
└── hooks/           # useMockUser
```

## Design System

Fonte de verdade: `AUGE-DESIGN-SYSTEM.md` na raiz do monorepo (um nível acima).
