const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware Global ──────────────────────────────────────────────
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ─── Configuración de URLs internas de Docker ───────────────────────
const SERVICES = {
  products: process.env.PRODUCTS_URL || 'http://products-service:3001',
  inventory: process.env.INVENTORY_URL || 'http://inventory-service:3002',
  orders: process.env.ORDERS_URL || 'http://orders-service:3003',
};

// ─── Health Check del Gateway ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    upstreamServices: SERVICES,
  });
});

// ─── Proxy: Catálogo de Productos → products-service:3001 ───────────
app.use(
  '/api/products',
  createProxyMiddleware({
    target: SERVICES.products,
    changeOrigin: true,
    pathRewrite: { '^/api/products': '/api/products' },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[GATEWAY] → Productos: ${req.method} ${req.originalUrl}`);
      },
      error: (err, req, res) => {
        console.error('[GATEWAY] ❌ Error proxy a Products:', err.message);
        res.status(502).json({
          success: false,
          error: 'Products Service no disponible',
          message: err.message,
        });
      },
    },
  })
);

// ─── Proxy: Inventario → inventory-service:3002 ─────────────────────
app.use(
  '/api/inventory',
  createProxyMiddleware({
    target: SERVICES.inventory,
    changeOrigin: true,
    pathRewrite: { '^/api/inventory': '/api/inventory' },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[GATEWAY] → Inventario: ${req.method} ${req.originalUrl}`);
      },
      error: (err, req, res) => {
        console.error('[GATEWAY] ❌ Error proxy a Inventory:', err.message);
        res.status(502).json({
          success: false,
          error: 'Inventory Service no disponible',
          message: err.message,
        });
      },
    },
  })
);

// ─── Proxy: Pedidos → orders-service:3003 ───────────────────────────
app.use(
  '/api/orders',
  createProxyMiddleware({
    target: SERVICES.orders,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '/api/orders' },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[GATEWAY] → Pedidos: ${req.method} ${req.originalUrl}`);
      },
      error: (err, req, res) => {
        console.error('[GATEWAY] ❌ Error proxy a Orders:', err.message);
        res.status(502).json({
          success: false,
          error: 'Orders Service no disponible',
          message: err.message,
        });
      },
    },
  })
);

// ─── Ruta 404 para endpoints no mapeados ────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `El endpoint ${req.originalUrl} no existe en el API Gateway`,
    availableRoutes: ['/api/products', '/api/inventory', '/api/orders', '/health'],
  });
});

// ─── Iniciar servidor ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway corriendo en puerto ${PORT}`);
  console.log(`📡 Rutas configuradas:`);
  console.log(`   /api/products  → ${SERVICES.products}`);
  console.log(`   /api/inventory → ${SERVICES.inventory}`);
  console.log(`   /api/orders    → ${SERVICES.orders}`);
  console.log(`   /health        → Estado del Gateway\n`);
});
