# Kartkatalog-frontend

## Beskrivelse

Brukergrensesnitt for å søke i og vise metadata som er registrert i GeoNetwork, samt bestille nedlasting. Henter alle data fra [kartkatalog-backend](../../backend/docs/backend.md) og fungerer som en BFF (backend-for-frontend) mot nettleseren.

## Teknologi

| Kategori           | Teknologi                                                                           |
| ------------------ | ----------------------------------------------------------------------------------- |
| Rammeverk          | Next.js 16 (App Router, `cacheComponents`, `typedRoutes`, React Compiler), React 19 |
| Språk              | TypeScript 7 (strict)                                                               |
| Styling            | CSS Modules, KV Designsystem (`@kv-designsystem/react`), Aksel-ikoner               |
| Kart               | OpenLayers (`ol`), `proj4`                                                          |
| Validering         | Zod (backend-svar parses i `src/lib/schemas`)                                       |
| Analyse / samtykke | PostHog, CookieYes                                                                  |
| Lint / format      | Biome                                                                               |
| Bygg               | `output: "standalone"`, Docker (multi-stage, Node 26)                               |

Versjoner: se [`package.json`](../package.json).

## Prosjektstruktur

```
src/
├── app/
│   ├── page.tsx            Søkeside
│   ├── metadata/[uuid]/    Detaljside (+ dekningskart)
│   ├── nedlasting/         Nedlastingsbestilling
│   ├── bff/                Route handlers (proxy mot backend)
│   ├── api.ts              Server-side klient mot backend
│   └── _components/        Route-nære komponenter (private mapper)
├── components/             Gjenbrukbare komponenter (Header, Footer, AuthProvider …)
├── lib/                    Hjelpere, Zod-skjemaer (`schemas/`), typer
└── posthog/                Analyseoppsett
```

Arbeidsregler og konvensjoner (serverkomponenter først, CSS Modules, breakpoints) står i [`../AGENTS.md`](../AGENTS.md).

## Ruter

| Rute                            | Beskrivelse                                     |
| ------------------------------- | ----------------------------------------------- |
| `/`                             | Søk med fasetter, sortering, kort-/listevisning |
| `/metadata/[uuid]`              | Detaljvisning av metadata                       |
| `/metadata/[uuid]/dekningskart` | Dekningskart                                    |
| `/nedlasting`                   | Nedlastingsbestilling (stegvis)                 |

## BFF-endepunkt (`/bff/*`)

Klientkomponenter bruker `bffPath` (`${basePath}/bff`) i stedet for å kalle backend direkte.

| Endepunkt                             | Backend-kall                                  | Brukes av                              |
| ------------------------------------- | --------------------------------------------- | -------------------------------------- |
| `GET /bff/search`                     | `GET /api/search`                             | Autocomplete i søkefeltet              |
| `GET /bff/metadata/[uuid]`            | `GET /metadata/{uuid}`                        | Nedlastingssiden                       |
| `GET /bff/download/options/[uuid]`    | `GET /api/download/options/{uuid}`            | Nedlastingssiden                       |
| `POST /bff/download/order`            | `POST /api/download/order`                    | Nedlastingssiden                       |
| `POST /bff/download/order-restricted` | `POST /api/download/order-restricted`         | Begrensede nedlastinger (Bearer-token) |
| `GET /bff/me/geoid`                   | `GET /api/me/geoid`                           | `AuthProvider`                         |
| `GET /bff/me`                         | – (leser autorisasjonsheader)                 | `AuthProvider` (Ansattporten)          |
| `GET /bff/auth/geoid/login`           | `GET /auth/geoid/login`                       | Innloggingsknapp i header              |
| `GET /bff/auth/geoid/callback`        | OIDC-callback                                 | GeoID (redirect-URI)                   |
| `POST /bff/auth/logout`               | `GET /auth/geoid/logout` (eller Ansattporten) | Profilmeny                             |
| `GET /bff/auth/ansattporten/login`    | – (setter provider-cookie, redirect)          | Innloggingsknapp i header              |

Serverkomponenter kaller backend direkte via `src/app/api.ts` (søk, metadata, linked-distributions, produktark, produktspesifikasjon, tegneregler, innsiktsgrupper).

## Miljøvariabler

Kopier `.env.example` → `.env.local`.

| Variabel                                                        | Beskrivelse                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| `API_BASE`                                                      | URL til backend, f.eks. `http://localhost:8080`              |
| `KATALOG_BASE_URL`                                              | Offentlig URL for frontend (origin-sjekk og `X-Forwarded-*`) |
| `REGISTER_BASE_URL`                                             | Register                                                     |
| `GEONETWORK_BASE_URL`                                           | Lenke til CSW-visning                                        |
| `EDITOR_BASE_URL`                                               | Lenke til metadataeditor                                     |
| `SITE_URL`                                                      | Brukes i strukturert data (SEO) på detaljsiden               |
| `NEXT_PUBLIC_BASE_PATH`                                         | Base path, f.eks. `/beta` – **bygges inn ved build**         |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` | PostHog (bygges inn ved build)                               |
| `NEXT_PUBLIC_DISPLAY_FULL_URL`                                  | Full fetch-URL i Next-logging (debug)                        |

`.env.example` dekker ikke alle variablene over; se tabellen.


## Valg og beslutninger

- **Next.js App Router med BFF** – backend-URL og cookies holdes på server; klienten treffer kun `/bff`.
- **KV Designsystem** foretrekkes fremfor egne komponenter; styling i colocated CSS Modules.
- **Zod-parsing av backend-svar** gir tidlig feil ved kontraktsendringer.
- **OpenLayers** i klientkomponenter (dekningskart, tegn område, legg til i kart).
- **Base path** (`/beta`) støtter parallell drift med legacy under samme domene.
- **Nedlastingsvalg lagres i nettleseren** (`usePersistedDownloadSelections`, `mapStorage`).
- **Analyse kun etter samtykke** (CookieYes + PostHog).

## Ting man kan stusse ved

- **`NEXT_PUBLIC_*` bygges inn ved build**, ikke ved kjøring – endring krever nytt image. `docker-compose.yml` sender `NEXT_PUBLIC_BASE_PATH` som build-arg.
- **Next.js 16 / React 19 / TypeScript 7** har breaking changes; les `node_modules/next/dist/docs/` før du antar gammel oppførsel (se `AGENTS.md`).
- **`isBeta` (`basePath === "/beta"`)** skjuler bl.a. brødsmulesti, og Ansattporten-innlogging redirecter til `/beta`.
- **To innloggingsleverandører:** GeoID (via backend, `GEOID_SESSION`) og Ansattporten (cookie `BearerToken` satt utenfra; valgt provider lagres i egen cookie). Derfor finnes både `/bff/me` og `/bff/me/geoid`.
- **Logout er POST med origin-sjekk** mot `KATALOG_ORIGIN`; feil `KATALOG_BASE_URL` gir 403.
- **Backend får `Origin` og `X-Forwarded-*`** fra `geoIdRequestHeaders` slik at OIDC/CSRF fungerer bak proxy.
- **Miniatyrbilder** tillates kun fra `editor(.test).geonorge.no` (`next.config.ts` + `isAllowedThumbnailUrl`).
- **Enkelte kall i `app/api.ts` er cachet** (`"use cache"`, `cacheLife("days")`, bl.a. innsiktsgrupper) – endringer kan dukke opp med forsinkelse.
- **Mapper med `_` er private** og rutes ikke.
- **`.next/` og `tsconfig.tsbuildinfo`** er genererte filer.

## Annen dokumentasjon

- [Next.js](https://nextjs.org/docs) · [KV Designsystem](https://www.npmjs.com/package/@kv-designsystem/react) · [OpenLayers](https://openlayers.org/) · [Biome](https://biomejs.dev/)
- Backend: [`backend/docs/backend.md`](../../backend/docs/backend.md) og Swagger (`/swagger`)
- Konvensjoner: [`../AGENTS.md`](../AGENTS.md), [`../README.md`](../README.md)
- Legacy: [Geonorge.Kartkatalog.React](https://github.com/kartverket/Geonorge.Kartkatalog.React)
- [GeoID](https://www.kartverket.no/om-kartverket/it-tjenester/geoid)
