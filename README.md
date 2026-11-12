# OmniaHub

> El centro donde proveedores, emprendedores y transportadoras se conectan para vender.

OmniaHub es una plataforma web de **dropshipping y e-commerce para Guatemala** (moneda: quetzales, Q). Un proveedor publica productos, un dropshipper los importa a su tienda en línea con su propio precio, un cliente compra, una transportadora entrega, y al marcarse **ENTREGADO** el dinero se reparte automáticamente en las billeteras de todos los participantes.

## Objetivo

Construir una plataforma completa y profesional, separada en **backend (API REST)** y **frontend (SPA)**, donde 5 roles trabajan sobre un mismo flujo de pedidos y dinero:

**cliente compra → dropshipper confirma → proveedor genera la guía → transportadora entrega → reparto automático en billeteras + factura**

## Roles

| Rol | Qué hace |
|---|---|
| Admin | Aprueba KYC, recargas y retiros; configura comisión, transportadoras, banners y políticas; ve reportes globales. |
| Proveedor | Publica productos, maneja inventario y compras, prepara órdenes y vende en físico con Caja/POS. |
| Dropshipper | Importa productos a su tienda, define su precio de venta, crea órdenes, cupones y clientes. |
| Transportadora | Ve sus guías, actualiza estados, reporta novedades y confirma cobros contraentrega. |
| Cliente | Compra en la tienda pública de un dropshipper y sigue sus pedidos y facturas. |

## Stack

| Capa | Tecnologías |
|---|---|
| Backend | Node.js, Express, MongoDB Atlas + Mongoose, JWT, bcryptjs, zod, helmet, cors, express-rate-limit, multer |
| Frontend | React, Vite, React Router, Tailwind CSS, Axios, lucide-react, recharts, react-hot-toast |

## Estructura

```
omniahub/
├── backend/     API REST (puerto 4000, prefijo /api)
├── frontend/    SPA React (puerto 5173, proxy /api → 4000)
└── docs/        API.md, PROMPTS.md
```

Cada carpeta tiene su propio `package.json`, `.env.example` y README.

## Instalación

Requisitos: Node.js 20 o superior y un cluster de **MongoDB Atlas**.

```bash
git clone https://github.com/juanlema-16/OmniaHub.git
cd OmniaHub
```

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # completa MONGODB_URI y JWT_SECRET
npm run dev
```

**Frontend** (en otra terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abre http://localhost:5173. La API responde en http://localhost:4000/api/health.

## Variables de entorno

**backend/.env**

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (4000) |
| `NODE_ENV` | `development` o `production` |
| `MONGODB_URI` | Cadena de conexión de Atlas: `mongodb+srv://…/omniahub` |
| `JWT_SECRET` | Clave para firmar los tokens |
| `JWT_EXPIRES_IN` | Vencimiento del token (ej. `1d`) |
| `CLIENT_URL` | Origen permitido por CORS (`http://localhost:5173`) |

**frontend/.env**

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (`/api`) |

## Modelo de ramas

```
main      ← versión estable (solo merges desde release)
 └─ dev   ← integración de features
     ├─ feature/backend-base
     ├─ feature/backend-negocio
     ├─ feature/frontend-base
     ├─ feature/frontend-paneles
     ├─ feature/frontend-tienda
     └─ release/v1.0.0
```

Las features se unen a `dev` con `git merge --no-ff`. Los commits siguen Conventional Commits en español: `tipo(alcance): descripción`.
