# Imagen base ligera de Node.js
FROM node:18-alpine

# Establecer directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias primero (aprovecha caché de Docker)
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --production

# Copiar el código fuente de la aplicación
COPY . .

# Exponer el puerto del API Gateway
EXPOSE 8080

# Comando para iniciar el servicio
CMD ["npm", "start"]
