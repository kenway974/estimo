# Build + run du backend (sert aussi le widget compilé). Cible Railway.
FROM node:20-alpine
WORKDIR /app

# 1) Manifests d'abord (cache des dépendances)
COPY package.json ./
COPY packages/server/package.json packages/server/package.json
COPY packages/widget/package.json packages/widget/package.json
RUN npm install

# 2) Code + build (widget puis serveur)
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "packages/server/dist/index.js"]
