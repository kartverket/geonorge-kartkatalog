FROM eclipse-temurin:21-jdk-noble AS build

WORKDIR /workspace

COPY --chmod=0755 gradlew .
COPY gradle/ ./gradle/
COPY src/ ./src/
COPY settings.gradle.kts build.gradle.kts gradle.properties ./

RUN --mount=type=cache,id=kartkatalog-backend-gradle-cache,target=/root/.gradle \
    ./gradlew buildFatJar --no-daemon \
    && test -s build/libs/application.jar


FROM eclipse-temurin:21-jre-noble AS runtime

WORKDIR /app

COPY --from=build --chown=0:0 --chmod=0444 \
    /workspace/build/libs/application.jar /app/application.jar

USER 150:150

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/application.jar"]