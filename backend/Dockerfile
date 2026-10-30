FROM eclipse-temurin:25-alpine-3.24 AS build

ARG RUN_VERIFICATIONS=true

WORKDIR /workspace

COPY --chmod=0755 gradlew .
COPY gradle/ ./gradle/
COPY src/ ./src/
COPY settings.gradle.kts build.gradle.kts gradle.properties .editorconfig ./

RUN --mount=type=cache,id=kartkatalog-backend-gradle-cache,target=/root/.gradle \
    if [ "$RUN_VERIFICATIONS" = "true" ]; then \
        ./gradlew ktlintCheck test --no-daemon; \
    fi && \
    ./gradlew buildFatJar --no-daemon
    
FROM ghcr.io/kartverket/emudhra-images/jre/dhi:jre-25.0-alpine3.24@sha256:0560e1680f602893991ce298a03975ebf3cc467fc0b01275ed1d83d03e013044 AS runtime

WORKDIR /app

COPY --from=build --chown=0:0 --chmod=0444 \
    /workspace/build/libs/application.jar /app/application.jar

USER 150:150

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail --silent --show-error http://127.0.0.1:8080/ || exit 1

ENTRYPOINT ["java", "-jar", "/app/application.jar"]