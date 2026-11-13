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
| `npm run dev` | Arranca la API con recarga automática (nodemon, configurado en `nodemon.json`) |
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

Cada módulo sigue el patrón **model → validator → service → controller → route**. La lógica de negocio vive en `services/` (por ejemplo, `wallet.service.js` es el único lugar que mueve saldos y siempre crea una `Transaction`).

Todas las respuestas siguen el formato `{ ok: true, data, message }` o `{ ok: false, message, errors }`, con errores de validación como `[{ campo, mensaje }]`. La paginación es `?page=1&limit=10` → `{ items, total, page, pages }`.

## Datos de prueba

`npm run seed` borra la base y crea:

- 10 usuarios demo (contraseña `Demo123*`): admin, 2 proveedores, 4 dropshippers (uno con KYC pendiente), 2 transportadoras y el cliente demo, más clientes para las reseñas.
- 6 categorías, 20 productos con ilustraciones SVG propias (`src/seed/assets`), 3 tiendas con productos importados.
- Tarifas de RutaExpress y Veloz GT para los 22 departamentos, cupón `BIENVENIDO10`, órdenes en todos los estados con transacciones de billetera coherentes, facturas, reseñas, tickets, banners, políticas y configuración (comisión 3 %, retiro mínimo Q100).

La lista de usuarios está en el [README principal](../README.md#usuarios-demo).

## Seguridad

- Contraseñas con bcrypt; el campo `password` nunca se devuelve.
- JWT en `Authorization: Bearer <token>` y `authorize(...roles)` en cada ruta.
- zod en todas las entradas, helmet, CORS limitado a `CLIENT_URL`, rate limit general y de 5 intentos de login cada 15 minutos.
- KYC aprobado obligatorio para publicar, vender y retirar.

## Archivos

- **Públicos** (imágenes de productos, logos, banners): `backend/uploads/`, servidos en `/uploads`.
- **Privados** (documentos de KYC y comprobantes de recarga): `backend/private-uploads/`, fuera de la carpeta estática. Solo se entregan por `/api/kyc/archivo/:archivo` y `/api/wallet/comprobantes/:archivo` al dueño o al admin.
- **Ilustraciones del seed:** versionadas en `src/seed/assets` y servidas en `/uploads/seed`.

Las dos carpetas de subidas están en `.gitignore` y se crean solas al subir el primer archivo.

## Endpoints

La lista completa, agrupada por módulo y con el rol que puede usar cada ruta, está en [`docs/API.md`](../docs/API.md).

## Comprobar que funciona

```bash
curl http://localhost:4000/api/health
```

Debe responder `{ "ok": true, "data": { "status": "ok", "db": "conectada", … } }`.
