# Use the official Node.js 18 slim image as the base
FROM node:18.20.4-slim

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

# Install project dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Set ownership of the /app directory to the node user
RUN chown -R node:node /app

# Switch to non-root user for better security
USER node

# Expose the application port
EXPOSE 3000

# Command to start the app
CMD ["pnpm", "start"]
