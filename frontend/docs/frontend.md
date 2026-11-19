# Kartkatalog-frontend

## Beskrivelse

Brukergrensesnitt for å søke i og vise metadata som er registrert i GeoNetwork, samt bestille nedlasting. Henter alle data fra kartkatalog-backend og fungerer som en BFF (backend-for-frontend) mot nettleseren.

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

Versjoner: se `package.json`.

## Prosjektstruktur

```
src/
├── app/
│   ├── [lang]/             Alle sider ligger under språksegmentet (`no`/`en`)
│   │   ├── layout.tsx      Rot-layout (`<html lang>`, `I18nProvider`)
│   │   ├── dictionaries/   Oversettelser (`no.json`, `en.json`)
│   │   ├── page.tsx        Søkeside
│   │   ├── metadata/[uuid]/ Detaljside (+ dekningskart)
│   │   └── nedlasting/     Nedlastingsbestilling
│   ├── bff/                Route handlers (proxy mot backend)
│   ├── api.ts              Server-side klient mot backend
│   └── _components/        Route-nære komponenter (private mapper)
├── components/             Gjenbrukbare komponenter (Header, Footer, AuthProvider …)
├── lib/                    Hjelpere, Zod-skjemaer (`schemas/`), typer, `i18n/`
├── proxy.ts                Språk-redirect for stier uten `/no` eller `/en`
└── posthog/                Analyseoppsett
```

Arbeidsregler og konvensjoner (serverkomponenter først, CSS Modules, breakpoints) står i `AGENTS.md`.

## Ruter

Alle sider har språkprefiks: `/no/...` eller `/en/...` (se [Språk (i18n)](#språk-i18n)).

| Rute                                   | Beskrivelse                                     |
| -------------------------------------- | ----------------------------------------------- |
| `/[lang]`                              | Søk med fasetter, sortering, kort-/listevisning |
| `/[lang]/metadata/[uuid]`              | Detaljvisning av metadata                       |
| `/[lang]/metadata/[uuid]/dekningskart` | Dekningskart                                    |
| `/[lang]/nedlasting`                   | Nedlastingsbestilling (stegvis)                 |

## Språk (i18n)

POC basert på [Next.js-guiden for internasjonalisering](https://nextjs.org/docs/app/guides/internationalization). Foreløpig er bare søkesiden oversatt; øvrige sider, Header og Footer er på norsk.

- **Routing:** `src/proxy.ts` sender stier uten gyldig språk videre til `/{språk}{sti}` med redirect, og beholder query-parameterne. Språket velges ut fra cookien `NEXT_LOCALE`, som settes av språkvelgeren i Header. Finnes ikke cookien, brukes `Accept-Language` (`nb`/`nn`/`no` gir `no`, `en` gir `en`). Standard er `no`. `/bff`, `_next` og statiske filer berøres ikke.
- **Ordbøker:** `src/app/[lang]/dictionaries/{no,en}.json`. `no.json` definerer typen `Dictionary`, så alle nøkler må finnes i begge filene. Tekster med variabler bruker `{navn}` og fylles inn med `format()` fra `@/lib/i18n/dictionary`.
- **Serverkomponenter:** `getDictionary()` og `getLocale()` fra `src/app/[lang]/dictionaries.ts` (leser `lang` via `next/root-params`).
- **Klientkomponenter:** `useDictionary()` og `useLocale()` fra `@/components/I18nProvider`. Provideren ligger i `[lang]/layout.tsx`.
- **Lenker:** interne lenker bygges med `localizedPath(locale, "/sti")` fra `@/lib/i18n`.
- **Backend:** `lang` sendes ikke til backend ennå, så titler og fasettverdier vises slik backend returnerer dem.
- **Nytt språk:** legg det til i `LOCALES` i `@/lib/i18n`, lag en ny JSON-fil og registrer den i `dictionaries.ts`.

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
- Legacy: [Geonorge.Kartkatalog.React](https://github.com/kartverket/Geonorge.Kartkatalog.React)
- [GeoID](https://www.kartverket.no/om-kartverket/it-tjenester/geoid)
