FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:26-alpine AS runtime

WORKDIR /app

COPY --from=build /app/public ./public
COPY --from=build --chown=150:150 /app/.next/standalone ./
COPY --from=build --chown=150:150 /app/.next/static ./.next/static

USER 150:150

EXPOSE 3000

CMD ["node", "server.js"]

