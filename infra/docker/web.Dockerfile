FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build -w @anc/shared && npm run build -w @anc/web
CMD ["npm", "run", "start", "-w", "@anc/web"]
