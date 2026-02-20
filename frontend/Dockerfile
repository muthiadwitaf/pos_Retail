FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Use Nginx to serve static files
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
# Default nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
