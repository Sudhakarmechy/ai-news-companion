FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build -w @anc/shared && npm run build -w @anc/api
CMD ["npm", "run", "start", "-w", "@anc/api"]
