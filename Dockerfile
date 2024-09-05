# Build stage
FROM node:20.17.0-slim AS builder

# Set the working directory
WORKDIR /app

# Install dependencies needed for running the project and puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package.json and pnpm-lock.yaml to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Ensure Puppeteer downloads Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=false

# Install project dependencies using pnpm, including puppeteer and chromium
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the app
RUN pnpm run build

# Runtime stage (Production Image)
FROM node:20.17.0-slim

# Install necessary Chromium dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libgbm-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the build artifacts from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Set Puppeteer to use Chromium installed via apt
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Ensure the node user can write to /app
RUN chown -R node:node /app

# Switch to non-root user for better security
USER node

# Expose the application port
EXPOSE 3001

# Command to start the app
CMD ["node", "dist/index.js"]