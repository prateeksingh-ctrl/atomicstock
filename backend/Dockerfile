FROM node:22-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma Client
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

