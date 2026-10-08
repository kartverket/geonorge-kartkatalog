FROM eclipse-temurin:21-jdk-noble AS build

ARG RUN_VERIFICATIONS=true

WORKDIR /workspace

COPY --chmod=0755 backend/gradlew .
COPY backend/gradle/ ./gradle/
COPY backend/src/ ./src/
COPY backend/settings.gradle.kts backend/build.gradle.kts backend/gradle.properties .editorconfig ./

RUN --mount=type=cache,id=kartkatalog-backend-gradle-cache,target=/root/.gradle \
    if [ "$RUN_VERIFICATIONS" = "true" ]; then \
        ./gradlew ktlintCheck test --no-daemon; \
    fi && \
    ./gradlew buildFatJar --no-daemon
    
FROM dhi.io/eclipse-temurin:21-alpine3.24 AS runtime

WORKDIR /app

COPY --from=build --chown=0:0 --chmod=0444 \
    /workspace/build/libs/application.jar /app/application.jar

USER 150:150

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail --silent --show-error http://127.0.0.1:8080/ || exit 1

ENTRYPOINT ["java", "-jar", "/app/application.jar"]