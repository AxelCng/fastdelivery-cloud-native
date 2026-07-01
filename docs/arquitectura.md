# Diagrama de Arquitectura Cloud Native (Entregable 1)

> Axel: pega aquí el diagrama (imagen o descripción) una vez esté listo.
> Debe incluir: Frontend, API Gateway, Microservicios, Bases de datos y Docker.

## Componentes

1. **Frontend** (Angular/React) - contenedor Docker independiente
2. **API Gateway** - centraliza el enrutamiento (`/api/products`, `/api/inventory`, `/api/orders`)
3. **Microservicios:**
   - Products Service → `products_db`
   - Inventory Service → `inventory_db`
   - Orders Service → `orders_db`
4. **Docker Compose** orquesta todos los contenedores en una misma red

## Flujo de comunicación

Frontend → API Gateway → Microservicio correspondiente → Base de datos propia
