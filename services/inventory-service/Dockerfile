FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar código fuente
COPY . .

# Exponer el puerto del servicio
EXPOSE 3002

# Comando para iniciar el servicio
CMD ["npm", "start"]
