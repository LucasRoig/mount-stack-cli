ARG APP_NAME=todo-change-me

FROM node:25-alpine AS base
RUN apk add --no-cache libc6-compat
RUN apk update

# PNPM setup
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10

FROM base AS builder
ARG APP_NAME
WORKDIR /app
RUN pnpm add -g turbo@2 && pnpm cache delete && pnpm store prune

COPY . .
RUN turbo prune --scope=${APP_NAME} --docker

FROM base AS installer
ARG APP_NAME
WORKDIR /app

#Fetch dependencies using only the lockfile and the workspace files
#This layer will be stable even if we change a script inside a package.json
COPY .gitignore .gitignore
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm fetch && pnpm cache delete && pnpm store prune

#Now copy packages.json and install dependencies previously fetched
COPY --from=builder /app/out/json/ .
RUN pnpm install -r --offline --frozen-lockfile  && pnpm cache delete && pnpm store prune

#Copy the source code now and build
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
COPY biome.json biome.json
RUN pnpm turbo run build --filter=${APP_NAME}

# Prune off the dev dependencies after build step
ENV CI=true
RUN pnpm install --prod --frozen-lockfile && pnpm cache delete && pnpm store prune

FROM node:25-alpine AS runner
ARG APP_NAME
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

RUN apk update && apk upgrade --no-cache

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000
ENV APP_NAME=${APP_NAME}

USER nodejs

COPY --from=installer --chown=nodejs:nodejs /app /app

CMD ["sh", "-c", "node apps/$APP_NAME/dist/index.mjs"]
