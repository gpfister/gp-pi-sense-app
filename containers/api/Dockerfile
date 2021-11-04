################################################################################
# Step 1: Build dependencies and code
################################################################################

FROM balenalib/raspberrypi3-node:14-buster-build as base

# Maintainer
LABEL version="0.0.1"
LABEL maintainer="Greg PFISTER"

# Install requirements
RUN set -ex \
  && apt-get update 

# Update NPM
# RUN npm i -g npm

# Copy code
COPY ./ /app

# Move to workdir
WORKDIR /app

# Install dependencies
RUN npm ci

# Build
RUN npm run build

# Remove non production dependencies
RUN npm prune --production


################################################################################
# Step 2: Build runtime
################################################################################

FROM balenalib/raspberrypi3-node:14-buster-run

# Maintainer
LABEL version="0.0.1"
LABEL maintainer="Greg PFISTER"

# Install requirements
RUN set -ex \
  && apt-get update

# Update NPM
# RUN npm i -g npm

# Copy code
COPY --from=base /app/ /app/
COPY .docker/dotenv /app/.env

# Move to workdir
WORKDIR /app

# Remove source code
RUN rm -rf src tsconfig.json

# Command
CMD node ./dist/server.js