# FastDelivery Perú - Plataforma Cloud Native

Caso Práctico 9 - Desarrollo de Sistemas Web Nativos de la Nube (CNA)

Plataforma de gestión de pedidos de delivery basada en arquitectura de microservicios,
contenedores Docker y prácticas DevOps.

## Arquitectura

Ver diagrama completo en [`docs/arquitectura.md`](docs/arquitectura.md).

```
Frontend (Angular/React)
        │
        ▼
   API Gateway  ──────────────┐
        │                     │
   ┌────┼────────┬────────────┘
   ▼    ▼        ▼
Products  Inventory  Orders
Service   Service    Service
   │         │          │
   ▼         ▼          ▼
products_db inventory_db orders_db
```

## Estructura del repositorio

```
├── frontend/                  # Aplicación web (Angular/React) - Mathc
├── api-gateway/                # API Gateway - Sandro
├── services/
│   ├── products-service/       # Microservicio de Catálogo - Axl
│   ├── inventory-service/      # Microservicio de Inventario - Rodrigo
│   └── orders-service/         # Microservicio de Pedidos - Jeicoll
├── k8s/                         # Manifiestos de Kubernetes (diseño) - Yuzo
├── docs/                        # Documento técnico y diagramas - Yuzo / Axel
├── .github/workflows/           # Pipeline CI/CD - Axel
└── docker-compose.yml           # Orquestación local de todos los servicios
```

## Equipo y responsabilidades

| Integrante | Responsabilidad |
|---|---|
| Axl | Microservicio de Catálogo de Productos |
| Rodrigo | Microservicio de Inventario |
| Jeicoll | Microservicio de Pedidos |
| Mathc | Frontend (Angular/React) |
| Sandro | API Gateway + docker-compose.yml |
| Axel | Arquitectura, repositorio Git, CI/CD |
| Yuzo | Kubernetes (diseño) + Documento Técnico |

## Cómo levantar el proyecto

```bash
docker compose up --build
```

Esto levanta: Frontend, API Gateway, los 3 microservicios y sus 3 bases de datos.

## Tecnologías

- **Frontend:** Angular / React
- **Backend:** Node.js + Express / Spring Boot
- **Bases de datos:** una por microservicio (Database per Service)
- **Contenedores:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Orquestación (diseño):** Kubernetes
