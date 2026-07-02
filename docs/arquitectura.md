# Documento Técnico de Arquitectura — FastDelivery Perú

## 1. Visión General

FastDelivery Perú es una plataforma de gestión de pedidos de delivery construida con **arquitectura de microservicios cloud native**. El sistema está diseñado para ser escalable, resiliente y desplegable en contenedores Docker y orquestable con Kubernetes.

## 2. Diagrama de Arquitectura

```
                          ┌─────────────────────┐
                          │     INTERNET         │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │   Ingress Controller  │
                          │   (Kubernetes)        │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │      FRONTEND         │
                          │   (Nginx :80)         │
                          │   HTML/CSS/JS         │
                          └──────────┬───────────┘
                                     │ /api/*
                          ┌──────────▼───────────┐
                          │    API GATEWAY        │
                          │  (Express :8080)      │
                          │  http-proxy-middleware │
                          └──────┬───┬───┬───────┘
                     ┌───────────┘   │   └───────────┐
                     │               │               │
           ┌─────────▼──────┐ ┌──────▼───────┐ ┌────▼──────────┐
           │   PRODUCTS     │ │  INVENTORY   │ │    ORDERS     │
           │   SERVICE      │ │  SERVICE     │ │   SERVICE     │
           │ (Express:3001) │ │(Express:3002)│ │(Express:3003) │
           └────────┬───────┘ └──────┬───────┘ └───────┬───────┘
                    │                │                  │
           ┌────────▼───────┐ ┌──────▼───────┐ ┌───────▼───────┐
           │  products_db   │ │ inventory_db │ │   orders_db   │
           │  (MongoDB:     │ │ (MongoDB:    │ │  (MongoDB:    │
           │   27017)       │ │  27017)      │ │   27017)      │
           └────────────────┘ └──────────────┘ └───────────────┘
```

## 3. Componentes del Sistema

### 3.1 Frontend (Nginx + HTML/CSS/JS)
| Propiedad | Valor |
|-----------|-------|
| **Puerto** | 80 |
| **Tecnología** | HTML5, CSS3, JavaScript vanilla |
| **Servidor** | Nginx Alpine |
| **Responsable** | Mathc |

**Funcionalidades:**
- Dashboard con estadísticas en tiempo real
- CRUD de Productos, Inventario y Pedidos
- Diseño responsive con modo oscuro premium
- Proxy reverso a API Gateway vía Nginx

**Configuración Nginx implementada:**
- Compresión GZIP para archivos estáticos
- Caché de recursos estáticos (7 días)
- Manejo de rutas SPA (`try_files`)
- Proxy pass hacia `api-gateway:8080`

---

### 3.2 API Gateway (Express + http-proxy-middleware)
| Propiedad | Valor |
|-----------|-------|
| **Puerto** | 8080 |
| **Tecnología** | Node.js 18 + Express |
| **Responsable** | Sandro |

**Tabla de Ruteo:**

| Ruta externa | Microservicio destino | URL interna Docker |
|---|---|---|
| `/api/products/**` | Products Service | `http://products-service:3001` |
| `/api/inventory/**` | Inventory Service | `http://inventory-service:3002` |
| `/api/orders/**` | Orders Service | `http://orders-service:3003` |
| `/health` | Gateway Health Check | (local) |

**Características:**
- Logging con Morgan (formato combined)
- Manejo de errores 502 (Bad Gateway) por servicio
- Respuesta 404 con rutas disponibles
- CORS habilitado

---

### 3.3 Products Service (Catálogo)
| Propiedad | Valor |
|-----------|-------|
| **Puerto** | 3001 |
| **Base de datos** | MongoDB (products_db) |
| **Responsable** | Axl |

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Listar todos los productos |
| GET | `/api/products/:id` | Obtener producto por ID |
| POST | `/api/products` | Crear nuevo producto |
| PUT | `/api/products/:id` | Actualizar producto |
| GET | `/health` | Health check |

**Modelo de datos:**
```
Product {
  name: String (requerido)
  description: String
  price: Number (requerido, min: 0)
  category: String (requerido)
  imageUrl: String
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

### 3.4 Inventory Service (Inventario)
| Propiedad | Valor |
|-----------|-------|
| **Puerto** | 3002 |
| **Base de datos** | MongoDB (inventory_db) |
| **Responsable** | Rodrigo |

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/inventory` | Listar inventario completo |
| GET | `/api/inventory/:id` | Obtener ítem por ID |
| POST | `/api/inventory` | Crear registro de inventario |
| PUT | `/api/inventory/:id` | Actualizar stock |
| GET | `/health` | Health check |

**Modelo de datos:**
```
Inventory {
  productId: String (requerido)
  productName: String (requerido)
  quantity: Number (requerido, min: 0)
  warehouse: String (default: "Almacén Principal")
  minStock: Number (default: 10)
  lastRestocked: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

### 3.5 Orders Service (Pedidos)
| Propiedad | Valor |
|-----------|-------|
| **Puerto** | 3003 |
| **Base de datos** | MongoDB (orders_db) |
| **Responsable** | Jeicoll |

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/orders` | Listar todos los pedidos |
| GET | `/api/orders/:id` | Obtener pedido por ID |
| POST | `/api/orders` | Crear nuevo pedido |
| PUT | `/api/orders/:id` | Actualizar pedido/estado |
| GET | `/health` | Health check |

**Modelo de datos:**
```
Order {
  customerName: String (requerido)
  customerAddress: String (requerido)
  customerPhone: String
  items: [OrderItem] (min: 1 ítem)
  totalAmount: Number (calculado automáticamente)
  status: Enum [pending, confirmed, in_transit, delivered, cancelled]
  createdAt: Date (auto)
  updatedAt: Date (auto)
}

OrderItem {
  productId: String (requerido)
  productName: String (requerido)
  quantity: Number (requerido, min: 1)
  unitPrice: Number (requerido, min: 0)
}
```

---

## 4. Patrón de Base de Datos

Se implementa el patrón **Database per Service**: cada microservicio posee su propia instancia de MongoDB independiente. Esto garantiza:

- **Desacoplamiento**: Cambios en el esquema de un servicio no afectan a otros
- **Escalabilidad independiente**: Cada base de datos se escala según la demanda del servicio
- **Resiliencia**: Fallo de una BD no impacta a los demás servicios

## 5. Contenedores Docker

### Imágenes utilizadas

| Servicio | Imagen base | Puerto | Dockerfile |
|----------|-------------|--------|------------|
| Frontend | `nginx:alpine` | 80 | `frontend/Dockerfile` |
| API Gateway | `node:18-alpine` | 8080 | `api-gateway/Dockerfile` |
| Products Service | `node:18-alpine` | 3001 | `services/products-service/Dockerfile` |
| Inventory Service | `node:18-alpine` | 3002 | `services/inventory-service/Dockerfile` |
| Orders Service | `node:18-alpine` | 3003 | `services/orders-service/Dockerfile` |
| Bases de datos | `mongo:7` | 27017 | (imagen oficial) |

### Docker Compose

El archivo `docker-compose.yml` orquesta los **9 contenedores** localmente:
- 1 Frontend (Nginx)
- 1 API Gateway
- 3 Microservicios
- 3 Bases de datos MongoDB
- 3 Volúmenes persistentes

**Comando de ejecución:**
```bash
docker compose up --build
```

## 6. Kubernetes (Diseño)

### Manifiestos en `/k8s`

| Archivo | Recursos |
|---------|----------|
| `namespace.yaml` | Namespace `fastdelivery` |
| `products-deployment.yaml` | Deployment + Service (Products + MongoDB) |
| `inventory-deployment.yaml` | Deployment + Service (Inventory + MongoDB) |
| `orders-deployment.yaml` | Deployment + Service (Orders + MongoDB) |
| `api-gateway-deployment.yaml` | Deployment + Service (Gateway) |
| `frontend-deployment.yaml` | Deployment + Service + Ingress (Frontend) |

### Características K8s implementadas

- **Réplicas**: 2 réplicas por microservicio y gateway para alta disponibilidad
- **Health Checks**: `livenessProbe` y `readinessProbe` en todos los servicios
- **Resource Limits**: CPU y memoria configurados por contenedor
- **Services ClusterIP**: Comunicación interna entre pods
- **Ingress**: Punto de entrada público para el frontend
- **Namespace**: Aislamiento lógico de todos los recursos

**Comando de despliegue:**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

## 7. CI/CD (GitHub Actions)

El pipeline definido en `.github/workflows/ci-cd.yml` cubre 3 fases:

### Fase 1: Build & Test
- Se ejecuta en **matriz** para los 5 componentes
- Instala dependencias, ejecuta linter y tests
- Se dispara en push y pull requests a `main`

### Fase 2: Docker Build & Push
- Construye las imágenes Docker de cada servicio
- Sube a Docker Hub con tags `latest` y `sha`
- Solo se ejecuta en push a `main`

### Fase 3: Deployment (Conceptual)
- Documenta el paso de `kubectl apply`
- Se ejecutará contra un clúster real en producción

## 8. Flujo de Comunicación

```
1. Usuario → Navegador → Frontend (Nginx:80)
2. Frontend → /api/* → Nginx proxy_pass → API Gateway (:8080)
3. API Gateway → http-proxy-middleware → Microservicio correspondiente
4. Microservicio → Mongoose → MongoDB (base de datos propia)
5. Respuesta JSON regresa por la misma cadena
```

## 9. Equipo y Responsabilidades

| Integrante | Rol | Archivos clave |
|------------|-----|-----------------|
| **Axl** | Products Service | `services/products-service/` |
| **Rodrigo** | Inventory Service | `services/inventory-service/` |
| **Jeicoll** | Orders Service | `services/orders-service/` |
| **Mathc** | Frontend | `frontend/` |
| **Sandro** | API Gateway + Docker Compose | `api-gateway/`, `docker-compose.yml` |
| **Axel** | CI/CD + Arquitectura repo | `.github/workflows/`, estructura Git |
| **Yuzo** | Kubernetes + Doc. Técnico | `k8s/`, `docs/` |
