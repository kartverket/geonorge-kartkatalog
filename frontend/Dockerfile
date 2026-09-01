FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

# Henter base path fra build-args i workflow, default ""
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=""
ENV NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=$NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ARG NEXT_PUBLIC_POSTHOG_HOST=""
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

RUN npm run build

FROM node:26-alpine AS runtime

WORKDIR /app

COPY --from=build /app/public ./public
COPY --from=build --chown=150:150 /app/.next/standalone ./
COPY --from=build --chown=150:150 /app/.next/static ./.next/static

USER 150:150

EXPOSE 3000

CMD ["node", "server.js"]

