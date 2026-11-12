# OmniaHub — Backend

API REST de OmniaHub construida con Node.js, Express y MongoDB Atlas (Mongoose).

## Requisitos

- Node.js 20 o superior
- Un cluster de MongoDB Atlas (la base se llama `omniahub`)

## Instalación

```bash
cd backend
npm install
cp .env.example .env   # en Windows: copy .env.example .env
```

Completa `MONGODB_URI` y `JWT_SECRET` en `.env`.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca la API con recarga automática (`node --watch`) |
| `npm start` | Arranca la API en modo normal |
| `npm run seed` | Borra y crea los datos de prueba |

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `4000` |
| `NODE_ENV` | Entorno | `development` |
| `MONGODB_URI` | Cadena de conexión de Atlas | `mongodb+srv://…/omniahub` |
| `JWT_SECRET` | Clave para firmar los tokens | cadena larga aleatoria |
| `JWT_EXPIRES_IN` | Vencimiento del token | `1d` |
| `CLIENT_URL` | Origen permitido por CORS | `http://localhost:5173` |

## Estructura

```
src/
├── server.js        arranque: conecta a MongoDB y levanta Express
├── app.js           middlewares, rutas y manejo de errores
├── config/          env.js, db.js
├── models/          modelos Mongoose
├── routes/          un archivo por módulo
├── controllers/     reciben req/res y llaman a services
├── services/        lógica de negocio
├── middlewares/     auth, roles, validate, errorHandler, upload
├── validators/      esquemas zod
├── utils/           ApiError, asyncHandler, generadores de códigos
└── seed/            datos de prueba
```

Todas las respuestas siguen el formato `{ ok: true, data, message }` o `{ ok: false, message, errors }`.

## Comprobar que funciona

```bash
curl http://localhost:4000/api/health
```
