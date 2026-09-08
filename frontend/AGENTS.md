<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend AGENTS.md

## Scope

Denne filen gjelder kun frontend-koden i `frontend/`.
Bruk den når du jobber med Next.js-app, komponenter, styling, routing og frontend-dokumentasjon i dette repoet.

## Frontend-oversikt

Frontend er en Next.js 16 / React 19-applikasjon med:

- App Router
- TypeScript i strict mode
- CSS Modules
- Biome for lint og formattering
- `@kv-designsystem/react` som primært UI-bibliotek
- `@navikt/aksel-icons` for ikoner

## Viktige mapper

```text
frontend/
├── AGENTS.md
├── README.md
├── package.json
├── next.config.ts
├── public/
└── src/
    ├── app/            Ruter, layouts og route-nære komponenter
    ├── components/     Gjenbrukbare UI-komponenter
    ├── lib/            Hjelpefunksjoner, schemas og domenelogikk
    └── posthog/        Analyse-/trackingoppsett
```

## Kommandoer

Kjør disse fra `frontend/`:

- `npm run dev` — start utviklingsserver
- `npm run build` — produksjonsbuild
- `npm run start` — kjør produksjonsbuild lokalt
- `npm run lint` — Biome-sjekk
- `npm run format` — formatter filer med Biome

Relevant fra repo-roten:

- `make frontend` — start frontend lokalt
- `make fmt` — formatter frontend
- `make install` — installer frontend-avhengigheter

## Arbeidsregler

- Hold endringer små og målrettede.
- Bevar eksisterende struktur og navnekonvensjoner.
- Følg App Router-mønstre og eksisterende komponentstruktur.
- Foretrekk serverkomponenter; legg til `"use client"` kun når du trenger browser-API-er, state, effekter eller interaktive designsystem-komponenter.
- Legg komponentspesifikk styling i colocated `*.module.css`.
- Hold `src/app/globals.css` liten; globale regler skal være unntaket.
- Foretrekk komponenter fra `@kv-designsystem/react` fremfor egen UI.
- Oppdater dokumentasjon når du innfører nye frontend-konvensjoner.

## Styling og designsystem

- Unngå å style KV Designsystem-komponenter via globale selektorer når komponent-API eller tokens dekker behovet.
- Hvis du må overstyre designsystem-klasser med `:global(...)`, skal det være lokalt scoped, begrunnet og i tråd med eksisterende mønstre i kodebasen.
- Ikke legg inn brede eller skjøre globale overrides som kan påvirke komponenter utenfor lokal kontekst.

## Routing og struktur

- `src/app/` følger file-based routing.
- Mapper med `_` er private og skal ikke rutes.
- Legg route-spesifikke komponenter nær ruten de tilhører.
- Legg generelle, gjenbrukbare komponenter i `src/components/`.

## Responsive størrelser: desktop / tablet / mobil

Bruk disse breakpoint-navnene konsekvent i frontend:

- `xl = 1280px`
- `lg = 1024px`
- `sm = 800px`

Tolkning i praksis:

- **Desktop:** bredder over `1280px`
- **Mindre desktop / overgang til tablet:** bredder `<= 1280px`
- **Tablet:** bredder `<= 1024px`
- **Mobil:** bredder `<= 800px`

Disse breakpointene skal matche på tvers av relaterte frontend-filer, spesielt i headeren, for eksempel:

- `src/components/Header/Header.module.css`
- `src/components/Header/HeaderMenu.module.css`
- andre relaterte header-filer

