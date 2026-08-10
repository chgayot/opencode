FROM oven/bun:1.3.14 AS build

ENV HUSKY=0

WORKDIR /app

# git is required to install the github:anomalyco/ghostty-web dependency;
# build-essential + python3 cover native install scripts (node-pty, tree-sitter).
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

COPY . .

# Match CI: plain `bun install` (workspace install also builds packages/app deps).
RUN bun install

# --single builds only the native linux-x64 binary; --skip-install skips the
# cross-arch opentui/parcel-watcher/fff-bun re-installs. OPENCODE_CHANNEL=prod
# makes the embedded vite build the production web UI; OPENCODE_VERSION avoids
# the git branch / npm registry lookups in packages/script.
RUN OPENCODE_CHANNEL=prod OPENCODE_VERSION=0.0.0-prod \
  bun ./packages/opencode/script/build.ts --single --skip-install

FROM debian:bookworm-slim

ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ripgrep git ca-certificates libgcc-s1 libstdc++6 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/packages/opencode/dist/opencode-linux-x64/bin/opencode /usr/local/bin/opencode

RUN opencode --version

WORKDIR /workspace

EXPOSE 4096

ENTRYPOINT ["opencode"]
CMD ["serve", "--hostname", "0.0.0.0", "--port", "4096"]
