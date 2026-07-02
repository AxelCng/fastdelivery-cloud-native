const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const orderRoutes = require('./routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'orders-service' });
});

// Configuración de conexión a MongoDB
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '27017';
const DB_NAME = process.env.DB_NAME || 'orders_db';
const PORT = process.env.PORT || 3003;

const MONGO_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Conectar a MongoDB y levantar el servidor
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`✅ Conectado a MongoDB: ${DB_NAME}`);
    app.listen(PORT, () => {
      console.log(`🚀 Orders Service corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  });
