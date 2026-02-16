# Stack Technique — ASSOSHUB

## Règles d'Or (Ne jamais dévier)

| Composant | Technologie |
|---|---|
| **Architecture** | Monorepo Nx |
| **Backend** | NestJS 11 |
| **Base de données** | SQLite (via Prisma ORM) |
| **Frontend** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS v4 + Design System "Glassmorphism" |
| **Icônes** | `lucide-react` |

## Conventions

- **Multi-tenant** : Chaque modèle possède un `associationId` (sauf exceptions).
- **SQLite** : Pas d'`enum` Prisma → utiliser `String` avec `@default("VALEUR")`.
- **Frontend** : Privilégier les Server Components sauf si hooks d'état nécessaires.
- **Typage** : TypeScript strict partout.
