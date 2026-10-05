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

## Authentication URLs

`PUBLIC_BASE_URL` is the public frontend URL used after login and logout. `AUTH_PUBLIC_BASE_URL` is the externally reachable backend ingress used to build the GeoID login and callback URLs. For local development these are typically `http://localhost:3000` and `http://localhost:8080`, respectively.
