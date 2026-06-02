FROM node:24-bookworm-slim

WORKDIR /app

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# install CLI globally (from local build context)
COPY . .

RUN corepack enable \
    && yarn install --frozen-lockfile \
    && yarn build \
    && npm install -g .
    
# default working directory for artifacts
WORKDIR /data

ENTRYPOINT ["web"]