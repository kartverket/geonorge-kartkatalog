# Geonorge Kartkatalog — Frontend

Next.js 16 + React 19 frontend for the Geonorge Kartkatalog. This document is meant to get you productive quickly, even if you haven't worked with the App Router before.

---

## Prerequisites

- **Node.js 20+** (matches `@types/node`)
- **npm** (package-lock is committed with npm)

Optional but recommended:

- VS Code with the **Biome** extension (formatting + linting on save).

---

## Getting started

```bash
npm install
npm run dev
```

The dev server prints a local URL (usually `http://localhost:3000`).

### Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with hot reload. |
| `npm run build` | Production build. Fails on type errors or invalid routes. |
| `npm run start` | Serve the production build locally. |
| `npm run lint` | Biome check (lint + formatting). |
| `npm run format` | Biome format `--write` — rewrites files in place. |

Run `npm run build` before opening a PR — it catches things `next dev` won't (typed-route errors, unused imports, etc.).

---

## Tech stack

- **[Next.js 16](https://nextjs.org)** — App Router, Server Components, [typed routes](https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes).
- **React 19** — with the [React Compiler](https://react.dev/learn/react-compiler) enabled (`reactCompiler: true` in `next.config.ts`), so most `useMemo` / `useCallback` calls are not needed.
- **TypeScript 5** — strict mode on.
- **[Biome](https://biomejs.dev/)** — formatter + linter (replaces ESLint + Prettier).
- **CSS Modules** — no CSS-in-JS, no Tailwind.
- **[Kartverket Designsystem](https://design.kartverket.no/?path=/docs/introduksjon--docs)** (`@kv-designsystem/react`) — component library. See section below.

---

## Directory layout

```
frontend/
├── public/                       Static assets served at /
├── src/
│   ├── app/                      App Router — folders here map to URLs
│   │   ├── layout.tsx            Root layout: <html>, <body>, DS setup
│   │   ├── page.tsx              /  (home — search results)
│   │   ├── globals.css           Global CSS + DS theme import
│   │   ├── _components/          Route-level shared components
│   │   │   ├── DatasetCard/
│   │   │   └── SearchResults/
│   │   └── metadata/[uuid]/      /metadata/<uuid>  (dataset detail)
│   │       ├── page.tsx
│   │       └── page.module.css
│   └── mocks/                    Fixture JSON — swap for real API calls later
│       ├── searchResult.json
│       └── getData.json
├── next.config.ts
├── tsconfig.json                 Path alias: @/* → src/*
├── biome.json                    Formatter + linter config
└── package.json
```

### Folder naming rules (App Router)

| Prefix | Meaning |
|---|---|
| `folder/` | **Route** — URL segment `/folder` |
| `_folder/` | **Private** — never routed, safe for components/helpers |
| `[param]/` | **Dynamic segment** — value available via `params` |
| `(group)/` | **Route group** — organizes without changing the URL |

Anything with `page.tsx` inside a route folder becomes a page. If a folder starts with `_`, Next will never treat it as a route.

---

## Conventions

### Server vs client components

Every file under `app/` is a **Server Component** by default. It's rendered to HTML on the server, ships zero JS to the browser, and can use `async/await`, `fetch`, secrets, DB calls.

Add `"use client"` at the top of a file the moment you need:

- `useState`, `useEffect`, `useReducer`, `useRef`, `useContext`
- Event handlers (`onClick`, `onChange`, etc.)
- Browser-only APIs (`window`, `document`, `navigator`, `localStorage`)
- Third-party components that internally use any of the above — including all `@kv-designsystem/react` components.

**Rule of thumb:** keep the boundary as deep in the tree as possible. Server Components are cheaper and better for SEO. See `DatasetCard.tsx` for an example — it's `"use client"` because it uses `useState` and the DS `<Button>`. `SearchResults.tsx` is client because it manages the `viewMode` state. `page.tsx` and the metadata detail page stay server because they don't need any of that.

### Components folder

- **`src/app/_components/`** — components tied to specific routes (e.g., `SearchResults` renders the home page's UI).
- **`src/components/`** — will hold truly reusable components once the app has more than one route needing them. Create when the second consumer appears.
- **Route-local `_components/`** — e.g. `app/metadata/[uuid]/_components/`. Use when a piece exists only to serve one route. Not created yet; add as needed.

Each component gets its own folder with its `.tsx` and `.module.css` colocated.

### Styles — CSS Modules

Use plain CSS Modules — one `Foo.module.css` per `Foo.tsx`, colocated in the same folder.

```tsx
import styles from "./MyThing.module.css";

<div className={styles.wrapper}>...</div>
```

- Class names are scoped automatically. `styles.wrapper` becomes something like `MyThing_wrapper__abc12`.
- Use `:global(.some-class)` to target library-provided classes (e.g., `.ds-card` from the design system).
- Don't reach across component folders for styles — each component owns its own module.

Global styles live in `src/app/globals.css` (font import, resets, DS theme import). Keep it small — component styles go in their own modules.

### Data fetching (later)

The home page and detail page currently import JSON fixtures from `src/mocks/`. When you hook up the real API:

```tsx
// In a Server Component
const res = await fetch("https://kartkatalog.geonorge.no/api/...", {
  next: { revalidate: 3600 }, // ISR: cache for 1 hour
});
if (!res.ok) throw new Error("Fetch failed");
const data = await res.json();
```

Do fetches in Server Components whenever possible. Client-side fetches only for things that must react to user interaction after the initial load.

### Routing

- File-system based: `app/foo/bar/page.tsx` → `/foo/bar`.
- Dynamic segments use square brackets: `app/metadata/[uuid]/page.tsx` → `/metadata/<uuid>`. Inside the page, `params` is a Promise that must be awaited:

```tsx
type Props = { params: Promise<{ uuid: string }> };

export default async function Page({ params }: Props) {
  const { uuid } = await params;
  ...
}
```

- Always link with `next/link`, not plain `<a>`:

```tsx
import Link from "next/link";

<Link href={`/metadata/${uuid}`}>...</Link>
```

- `next/link` gives you prefetching and instant client-side transitions.

### Typed routes

`typedRoutes: true` is enabled in `next.config.ts`. This means the `href` prop on `<Link>` and calls like `router.push(...)` are **type-checked against the actual route tree**. Rename a folder or mistype a URL and you get a TypeScript error at build time.

- Dynamic hrefs from data (e.g., `` `/metadata/${uuid}` ``) still work if the template literal matches the route pattern.
- For hrefs built from truly opaque strings, cast to `Route` from `next`:

```tsx
import type { Route } from "next";
<Link href={untrustedUrl as Route}>...</Link>
```

---

## Design system

**All UI components should come from the [Kartverket Designsystem](https://design.kartverket.no/?path=/docs/introduksjon--docs)** — package `@kv-designsystem/react`. Buttons, cards, headings, tags, form fields, dialogs, etc.

### Icons — Nav Aksel

Use **[@navikt/aksel-icons](https://aksel.nav.no/ikoner)** for all icons. It's already installed as a transitive dependency of the design system.


## Further reading

- [Kartverket Designsystem](https://design.kartverket.no/?path=/docs/kom-i-gang-som-utvikler--docs)
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [React 19 docs](https://react.dev/)
- [Biome docs](https://biomejs.dev/)



