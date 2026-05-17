# Energy Bill Simulator API

[English](#english) · [Español](#español)

---

<a name="english"></a>
# English

A REST API that simulates CFE (Mexico's national electric utility) electricity bills. Users can register energy contracts, log bimonthly consumption records, and get a detailed billing breakdown inspired by CFE residential tariff rules.

## Database Model

![Database model](docs/energyAPI.svg)

## Architecture

The project follows a layered architecture:

- Routes → HTTP routing
- Controllers → Request/response handling
- Services → Business logic
- Prisma ORM → Database access
- Middleware → Authentication, authorization and validation

The billing engine is isolated inside the service layer to keep domain logic independent from HTTP concerns.

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT (15 min access token + 7 day refresh token with rotation)
- **Security:** bcrypt, httpOnly cookies
- **Validation:** Zod
- **Roles:** ADMIN / USER

## Features

- JWT authentication with refresh token rotation and logout revocation
- Role-based access control (RBAC)
- Full CRUD for energy contracts and consumption records
- CFE tariff catalog (types 1, 1A, 1B, 1C, 1D, 1E, 1F) with monthly rate blocks
- City → tariff mapping with per-city summer period configuration
- Billing simulation with:
  - Pure and mixed (summer/non-summer) period detection
  - Block-based consumption pricing (Básico / Intermedio / Excedente)
  - Proportional block limits for sub-periods
  - IVA (16%) and DAP breakdown

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login, returns access token + sets refresh cookie |
| POST | `/refresh-token` | Cookie | Issue a new access token |
| POST | `/logout` | Cookie | Revoke refresh token |
| GET | `/profile` | Bearer | Return current user info |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer + ADMIN | List all users |

### Contracts — `/api/contracts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | List user's contracts |
| GET | `/:id` | Bearer | Get a contract |
| POST | `/` | Bearer | Create a contract |
| PUT | `/:id` | Bearer | Update a contract |
| DELETE | `/:id` | Bearer | Delete a contract |

### Consumption Records — `/api/contracts/:contractId/consumption-records`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | List records for a contract |
| GET | `/:recordId` | Bearer | Get a record |
| POST | `/` | Bearer | Create a record |
| PUT | `/:recordId` | Bearer | Update kWh values (period is immutable) |
| DELETE | `/:recordId` | Bearer | Delete a record |
| GET | `/:recordId/simulate-billing` | Bearer | Simulate CFE bill for this record |

### Billing simulation response example

The billing simulator supports:

- Mixed billing periods crossing summer/non-summer boundaries
- Proportional block limits based on subperiod days
- Historical monthly tariff rates
- Seasonal pricing
- IVA and DAP estimation

```json
{
  "period": { "start": "2026-02-17T00:00:00.000Z", "end": "2026-04-17T00:00:00.000Z", "totalDays": 59 },
  "isMixed": true,
  "nonSummer": {
    "days": 42,
    "kwhConsumed": 164,
    "blocks": [
      { "blockName": "Básico", "kwhConsumed": 75, "pricePerKwh": 1.116, "subtotal": 83.7 },
      { "blockName": "Intermedio", "kwhConsumed": 89, "pricePerKwh": 1.357, "subtotal": 120.77 }
    ],
    "subtotal": 204.47
  },
  "summer": {
    "days": 17,
    "kwhConsumed": 130,
    "blocks": [
      { "blockName": "Básico", "kwhConsumed": 96, "pricePerKwh": 1.001, "subtotal": 96.1 },
      { "blockName": "Intermedio bajo", "kwhConsumed": 34, "pricePerKwh": 1.159, "subtotal": 39.41 }
    ],
    "subtotal": 135.51
  },
  "energiaSubtotal": 339.98,
  "iva": 54.4,
  "facturaDelPeriodo": 394.38,
  "dapEstimado": 17.0,
  "totalEstimado": 411.38
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Installation

```bash
git clone <repo-url>
cd api-express
npm install
```

### Environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/api_energy"
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
PORT=3000
```

### Database setup

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed creates:
- 2 default users (`admin@example.com` / `Admin123!` and `demo@example.com` / `Demo123!`)
- 7 CFE tariff types with monthly rate blocks for T1D (2025–2026)
- 16 cities mapped to their CFE tariff with summer period configuration

### Run

```bash
npm run dev
```

## Project Status

Backend API is functional and currently under active development.

Planned next steps:
- Frontend dashboard (React / Next.js)
- Charts and consumption reports
- Pagination
- Integration tests
- Deployment

---

<a name="español"></a>
# Español

API REST que simula recibos de electricidad de la CFE. Los usuarios pueden registrar contratos de energía, capturar registros de consumo bimestrales y obtener un desglose detallado de la factura inspirada en reglas
tarifarias residenciales de CFE.

## Modelo de base de datos

![Modelo de base de datos](docs/energyAPI.svg)

## Arquitectura

El proyecto sigue una arquitectura en capas:

- Routes → Enrutamiento HTTP
- Controllers → Manejo de request/response
- Services → Lógica de negocio
- Prisma ORM → Acceso a base de datos
- Middleware → Autenticación, autorización y validación

El motor de facturación está aislado en la capa de servicios para mantener la lógica de dominio independiente de HTTP.

## Stack tecnológico

- **Runtime:** Node.js + Express
- **Base de datos:** PostgreSQL con Prisma ORM
- **Auth:** JWT (access token 15 min + refresh token 7 días con rotación)
- **Seguridad:** bcrypt, cookies httpOnly
- **Validación:** Zod
- **Roles:** ADMIN / USER

## Funcionalidades

- Autenticación JWT con rotación de refresh token y revocación en logout
- Control de acceso por roles (RBAC)
- CRUD completo de contratos de energía y registros de consumo
- Catálogo de tarifas CFE (1, 1A, 1B, 1C, 1D, 1E, 1F) con bloques mensuales
- Mapeo ciudad → tarifa con configuración de periodo de verano por ciudad
- Simulación de factura con:
  - Detección de periodos puros y mixtos (verano / no-verano)
  - Bloques tarifarios (Básico / Intermedio / Excedente) con precios por kWh
  - Límites proporcionales de bloque para subperiodos
  - Desglose de IVA (16%) y DAP estimado

## Endpoints

### Auth — `/api/auth`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/register` | No | Registrar nuevo usuario |
| POST | `/login` | No | Login; devuelve access token y establece cookie de refresh |
| POST | `/refresh-token` | Cookie | Emitir nuevo access token |
| POST | `/logout` | Cookie | Revocar refresh token |
| GET | `/profile` | Bearer | Datos del usuario actual |

### Usuarios — `/api/users`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/` | Bearer + ADMIN | Listar todos los usuarios |

### Contratos — `/api/contracts`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/` | Bearer | Listar contratos del usuario |
| GET | `/:id` | Bearer | Obtener un contrato |
| POST | `/` | Bearer | Crear contrato |
| PUT | `/:id` | Bearer | Actualizar contrato |
| DELETE | `/:id` | Bearer | Eliminar contrato |

### Registros de consumo — `/api/contracts/:contractId/consumption-records`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/` | Bearer | Listar registros del contrato |
| GET | `/:recordId` | Bearer | Obtener un registro |
| POST | `/` | Bearer | Crear registro |
| PUT | `/:recordId` | Bearer | Actualizar kWh (el periodo es inmutable) |
| DELETE | `/:recordId` | Bearer | Eliminar registro |
| GET | `/:recordId/simulate-billing` | Bearer | Simular factura CFE para este registro |

### Ejemplo de respuesta — simulación de factura

El simulador de factura soporta:

- Periodos de facturación mixtos que cruzan el límite verano/no-verano
- Límites de bloque proporcionales según los días del subperiodo
- Tarifas mensuales históricas
- Precios por temporada
- Estimación de IVA y DAP

```json
{
  "period": { "start": "2026-02-17T00:00:00.000Z", "end": "2026-04-17T00:00:00.000Z", "totalDays": 59 },
  "isMixed": true,
  "nonSummer": {
    "days": 42,
    "kwhConsumed": 164,
    "blocks": [
      { "blockName": "Básico", "kwhConsumed": 75, "pricePerKwh": 1.116, "subtotal": 83.7 },
      { "blockName": "Intermedio", "kwhConsumed": 89, "pricePerKwh": 1.357, "subtotal": 120.77 }
    ],
    "subtotal": 204.47
  },
  "summer": {
    "days": 17,
    "kwhConsumed": 130,
    "blocks": [
      { "blockName": "Básico", "kwhConsumed": 96, "pricePerKwh": 1.001, "subtotal": 96.1 },
      { "blockName": "Intermedio bajo", "kwhConsumed": 34, "pricePerKwh": 1.159, "subtotal": 39.41 }
    ],
    "subtotal": 135.51
  },
  "energiaSubtotal": 339.98,
  "iva": 54.4,
  "facturaDelPeriodo": 394.38,
  "dapEstimado": 17.0,
  "totalEstimado": 411.38
}
```

## Instalación

### Requisitos

- Node.js 18+
- PostgreSQL

### Pasos

```bash
git clone <url-del-repo>
cd api-express
npm install
```

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/api_energy"
JWT_SECRET="tu_jwt_secret"
JWT_REFRESH_SECRET="tu_refresh_secret"
PORT=3000
```

### Base de datos

```bash
npx prisma migrate dev
npx prisma db seed
```

El seed crea:
- 2 usuarios por defecto (`admin@example.com` / `Admin123!` y `demo@example.com` / `Demo123!`)
- 7 tipos de tarifa CFE con bloques de precios mensuales para T1D (2025–2026)
- 16 ciudades mapeadas a su tarifa CFE con periodo de verano configurado

### Ejecutar

```bash
npm run dev
```

## Estado del proyecto

El backend está funcional y en desarrollo activo.

Próximos pasos:
- Dashboard frontend (React / Next.js)
- Gráficas y reportes de consumo
- Paginación
- Tests de integración
- Despliegue
