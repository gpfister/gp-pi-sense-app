################################################################################
# Step 1: Build dependencies and code
################################################################################

FROM balenalib/raspberrypi3-node:12-buster-build as base

# Maintainer
LABEL version="0.0.1"
LABEL maintainer="Greg PFISTER"

# Install requirements
RUN set -ex \
  && apt-get update \
  && apt-get install --yes --no-install-recommends libudev-dev libbluetooth-dev 

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

FROM balenalib/raspberrypi3-node:12-buster-run

# Maintainer
LABEL version="0.0.1"
LABEL maintainer="Greg PFISTER"

# Install requirements
RUN set -ex \
  && apt-get update \
  && apt-get install --yes --no-install-recommends libudev1 libbluetooth3

# Update NPM
# RUN npm i -g npm

# Copy code
COPY --from=base /app/ /app/
COPY .docker/dotenv /app/.env
# COPY .docker/entrypoint.sh /app/entrypoint.sh

# Move to workdir
WORKDIR /app

# Remove source code
RUN rm -rf src tsconfig.json

# Entrypoint
# ENTRYPOINT [ "bash", "entrypoint.sh" ]

# Command
CMD node ./dist/gp_pi_sense.js
