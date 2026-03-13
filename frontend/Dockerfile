FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_LOGTO_ENDPOINT
ARG VITE_LOGTO_APP_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LOGTO_ENDPOINT=$VITE_LOGTO_ENDPOINT
ENV VITE_LOGTO_APP_ID=$VITE_LOGTO_APP_ID
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
