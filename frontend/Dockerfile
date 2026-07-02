# ─── Etapa 1: Build (preparación de archivos estáticos) ──────────
# Usamos node solo para generar estructura; como es vanilla HTML/CSS/JS,
# simplemente copiamos los archivos al directorio de build.
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de la aplicación frontend
COPY . .

# ─── Etapa 2: Producción con Nginx ──────────────────────────────
# Imagen ligera de Nginx para servir los archivos estáticos
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
# Incluye: SPA routing, GZIP, caché, proxy al API Gateway
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos del frontend al directorio de Nginx
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY --from=build /app/css /usr/share/nginx/html/css/
COPY --from=build /app/js /usr/share/nginx/html/js/

# Exponer el puerto HTTP estándar
EXPOSE 80

# Nginx se ejecuta en primer plano
CMD ["nginx", "-g", "daemon off;"]
