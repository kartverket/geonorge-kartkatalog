# kartkatalog-backend

This project was created using the [Ktor Project Generator](https://start.ktor.io).

Here are some useful links to get you started:

* [Ktor Documentation](https://ktor.io/docs/home.html)
* [Ktor GitHub page](https://github.com/ktorio/ktor)
* [Ktor Slack chat](https://app.slack.com/client/T09229ZC6/C0A974TJ9). [Request an invite](https://surveys.jetbrains.com/s3/kotlin-slack-sign-up).

## Features

Here's a list of features included in this project:

| Name                                                                              | Description                                                                        |
|-----------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| [Content Negotiation](https://start.ktor.io/p/io.ktor/server-content-negotiation) | Provides automatic content conversion according to Content-Type and Accept headers |
| [Call Logging](https://start.ktor.io/p/io.ktor/server-call-logging)               | Logs client requests                                                               |
| [Status Pages](https://start.ktor.io/p/io.ktor/server-status-pages)               | Provides exception handling for routes                                             |
| [CORS](https://start.ktor.io/p/io.ktor/server-cors)                               | Enables Cross-Origin Resource Sharing (CORS)                                       |

## Building & Running

To build or run the project, use one of the following tasks:

| Task              | Description       |
|-------------------|-------------------|
| `./gradlew test`  | Run the tests     |
| `./gradlew build` | Build the project |
| `./gradlew run`   | Run the server    |

If the server starts successfully, you'll see the following output:

```
2024-12-04 14:32:45.584 [main] INFO  Application - Application started in 0.303 seconds.
2024-12-04 14:32:45.682 [main] INFO  Application - Responding at http://0.0.0.0:8080
```

## Restricted downloads

`ALLOWED_DOWNLOAD_CLIENTS` is an optional, comma-separated allowlist of download API origins that may receive a user's GeoID access token for a restricted download order:

Each value must be an HTTPS origin (scheme, host, and optional port), without a path, query, fragment, or user info. HTTP origins are rejected so a GeoID access token cannot be sent over plaintext. When the variable is absent or empty, the allowlist is empty: open downloads still work, while restricted orders are rejected before the token is sent to an unapproved destination.

## Legacy search compatibility

Both `GET /search` and `GET /api/search` share Solr execution and neutral search hits/facet counts. Each adapter prepares its own query: `/api/search` uses the original modern `SearchQueryBuilder`, while `/search` uses legacy-specific query rules. `/search` serves the legacy Kartkatalog `/api/search` contract: it accepts legacy `text`, `limit`, `offset`, `orderby`, `listhidden` and indexed `facets[n]name`/`facets[n]value` query parameters; JSON uses PascalCase keys and omits null properties. On **either** search route, `Accept: text/csv` (or `application/csv`), or `mediatype=csv`, produces the same semicolon-delimited export from that route's results, with `Content-Disposition: attachment; filename=kartkatalogen.csv`. The export includes only the requested page; an empty result produces an empty CSV body, as in legacy. For CSV, `lang=en`, the `_culture` cookie or `Accept-Language` select the English `metadata_all_en` core; Norwegian uses `metadata_all`. `/search` also applies this language selection to JSON.

Search format selection honors `Accept` quality (`q`) values and exact media types; wildcards alone do not select CSV, and `q=0` excludes it. A nonempty `mediatype` query parameter overrides `Accept` (`csv`, `text/csv`, or `application/csv`; other values select JSON). CSV uses the selected CSV media type in `Content-Type`. Language priority is `lang` query parameter, then `_culture` cookie, then the highest-quality supported `Accept-Language` entry (`en`, `no`, `nb`, `nn` and regional variants). Without a supported choice the default is Norwegian. `/api/search` JSON continues to use the Norwegian core regardless of these language hints.

`/api/search` retains its original query/filter/sort rules and camelCase JSON response contract for the new frontend, including flat facets and modern metadata fields. Its request normalization and upstream-error response (502) are retained for both JSON and CSV; `/search` returns an empty 200 response for Solr search failures.

Set `KARTKATALOG_BASE_URL` to the public Kartkatalog frontend URL used by legacy `ShowDetailsUrl` and `OrganizationUrl`. It falls back to `PUBLIC_BASE_URL` if not set. Search errors from Solr produce the legacy empty search result; other upstream failures remain errors.

The compatibility endpoint deliberately does **not** make Vertex AI embedding calls or perform vector search. Text-match sets, relevance sorting, and pages can therefore differ from legacy with vector search enabled. Other `api/*` endpoints are not included in this compatibility route.
