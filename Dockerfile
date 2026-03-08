FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client before building
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma: schema + migrations + generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Install prisma CLI with ALL dependencies (for migrate deploy)
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
RUN npm install prisma --no-save

EXPOSE 8083
ENV PORT=8083
ENV HOSTNAME="0.0.0.0"

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
