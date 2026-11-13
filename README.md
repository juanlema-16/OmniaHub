# OmniaHub

> El centro donde proveedores, emprendedores y transportadoras se conectan para vender.

OmniaHub es una plataforma web de **dropshipping y e-commerce para Guatemala** (moneda: quetzales, `Q`). Un proveedor publica productos, un dropshipper los importa a su tienda en línea con su propio precio, un cliente compra, una transportadora entrega y, al marcarse **ENTREGADO**, el dinero se reparte automáticamente en las billeteras de todos los participantes y se genera la factura.

Está separada en una **API REST** (`/backend`) y una **SPA** (`/frontend`), cada una con su propio `package.json`, `.env.example` y README.

## Objetivo

Construir una plataforma completa y profesional donde **5 roles** trabajan sobre un mismo flujo de pedidos y dinero:

**cliente compra → dropshipper confirma → proveedor genera la guía → transportadora entrega → reparto automático en 4 billeteras + factura**

## Roles

| Rol | Qué hace |
|---|---|
| **Admin** | Dueño de la plataforma. Aprueba KYC, recargas y retiros; configura comisión, monto mínimo de retiro, transportadoras y tarifas, banners y políticas; ve reportes globales, auditoría, tickets y reseñas. Puede corregir el estado de una orden (queda en auditoría). |
| **Proveedor** | Publica productos con precio proveedor y precio sugerido, maneja inventario y compras de mercancía, prepara las órdenes y genera la guía, y vende en físico con Caja/POS. |
| **Dropshipper** | Explora el catálogo, marca favoritos, importa productos a su tienda con su precio de venta, crea órdenes, soluciona novedades y maneja cupones, clientes y su transportadora favorita por departamento. |
| **Transportadora** | Ve sus guías, marca en tránsito, entregado o devolución, reporta novedades y confirma el cobro contra entrega. |
| **Cliente** | Explora las tiendas, compra con pago contra entrega o tarjeta simulada, sigue sus pedidos, descarga sus facturas y califica lo que recibió. |

## Funcionalidades

- **Autenticación y seguridad:** registro con verificación de correo (código de 6 dígitos), login con JWT, contraseñas con bcrypt, rate limit en login, roles en cada ruta y validación con zod en todas las entradas.
- **KYC:** proveedor y dropshipper suben DPI frente, reverso y selfie; el admin aprueba o rechaza con motivo. Sin KYC aprobado no pueden publicar, vender ni retirar.
- **Catálogo y productos:** precio proveedor y sugerido, stock y stock mínimo, imágenes, categorías y alerta de stock bajo.
- **Órdenes:** creación desde el panel o desde la tienda, resumen de ganancia en vivo (no permite enviar con ganancia negativa), cotización de transportadoras por departamento, guía única `OH-AAAA-NNNNNN`, línea de tiempo de estados y novedades.
- **Envíos:** 2 transportadoras simuladas (RutaExpress y Veloz GT) con tarifas y días por departamento, los 22 departamentos y sus 340 municipios.
- **Billetera:** historial de ENTRADA/SALIDA con exportación CSV, recargas con comprobante, retiros con datos bancarios (mínimo Q100, monto reservado hasta que el admin decide).
- **Cupones, clientes, facturación** (`FAC-000001`, imprimible), **Caja/POS** con arqueo, **inventario y compras**, **reportes** con gráficas y CSV.
- **Tienda pública** por dropshipper (`/tienda/:slug`) con carrito validado contra la API, cupón, checkout y confirmación; directorio "Explorar tiendas" y tiendas destacadas en la landing.
- **Publicidad** (banners por ubicación y rol), **políticas** editables, **banner de cookies** y **notificaciones** internas.
- **Extras:** tickets de soporte con conversación y estados, reseñas de productos entregados (con moderación del admin), favoritos en el catálogo y **modo oscuro** en toda la aplicación.

## Stack

| Capa | Tecnologías |
|---|---|
| Backend | Node.js, Express, MongoDB Atlas + Mongoose, JWT, bcryptjs, zod, helmet, cors, express-rate-limit, multer, dotenv |
| Frontend | React, Vite, React Router, Tailwind CSS, Axios, lucide-react, recharts, react-hot-toast |

## Arquitectura

```
omniahub/
├── backend/            API REST (puerto 4000, prefijo /api)
│   └── src/
│       ├── models/       un modelo Mongoose por colección
│       ├── validators/   esquemas zod
│       ├── services/     lógica de negocio (órdenes, billetera, envíos…)
│       ├── controllers/  reciben req/res y llaman a los services
│       ├── routes/       un archivo por módulo, con auth + authorize(roles)
│       ├── middlewares/  auth, validate, upload, errorHandler, rate limit
│       └── seed/         datos de prueba e ilustraciones SVG propias
├── frontend/           SPA React (puerto 5173, proxy de /api y /uploads hacia 4000)
│   └── src/
│       ├── api/          axios con el JWT + un archivo por módulo
│       ├── context/      sesión, carrito y tema
│       ├── components/   layout, ui reutilizable y componentes por módulo
│       ├── pages/        public, store, admin, proveedor, dropshipper, transportadora, cliente, shared
│       └── routes/       rutas y menú de cada rol
└── docs/
    ├── API.md          endpoints por módulo (método, ruta, rol y descripción)
    └── PROMPTS.md      prompts usados para construir el proyecto
```

Cada módulo del backend sigue el patrón **model → validator → service → controller → route**. Las respuestas tienen siempre el formato `{ ok: true, data, message }` o `{ ok: false, message, errors }`, y la paginación es `?page=1&limit=10` → `{ items, total, page, pages }`.

## Instalación

Requisitos: **Node.js 20 o superior** y un cluster de **MongoDB Atlas** (se usa como replica set para las transacciones de la billetera).

1. Clona el repositorio:

   ```bash
   git clone https://github.com/juanlema-16/OmniaHub.git
   cd OmniaHub
   ```

2. Backend:

   ```bash
   cd backend
   npm install
   cp .env.example .env      # en Windows: copy .env.example .env
   ```

   Completa `MONGODB_URI` (con `/omniahub` al final) y `JWT_SECRET` en `backend/.env`. Luego carga los datos de prueba y arranca la API:

   ```bash
   npm run seed
   npm run dev
   ```

3. Frontend, en otra terminal:

   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

4. Abre http://localhost:5173. La API responde en http://localhost:4000/api/health.

`npm run seed` borra y vuelve a crear todos los datos; las sesiones abiertas dejan de servir y hay que volver a iniciar sesión.

## Variables de entorno

**backend/.env**

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `4000` |
| `NODE_ENV` | `development` o `production`. En desarrollo el código de verificación se imprime en la consola y se devuelve como `devCode` | `development` |
| `MONGODB_URI` | Cadena de conexión de Atlas | `mongodb+srv://usuario:clave@cluster0.xxxxx.mongodb.net/omniahub` |
| `JWT_SECRET` | Clave para firmar los tokens | cadena larga y aleatoria |
| `JWT_EXPIRES_IN` | Vencimiento del token | `1d` |
| `CLIENT_URL` | Origen permitido por CORS | `http://localhost:5173` |

**frontend/.env**

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `/api` (proxy de Vite hacia `localhost:4000`) |

## Usuarios demo

Contraseña de todos: **`Demo123*`**. En la pantalla de login hay botones para entrar con cada uno.

| Rol | Correo | Notas |
|---|---|---|
| Admin | `admin@omniahub.test` | |
| Proveedor | `proveedor@omniahub.test` | Distribuidora Maya, KYC aprobado |
| Proveedor | `proveedor2@omniahub.test` | Importadora Quetzal, KYC aprobado |
| Dropshipper | `dropshipper@omniahub.test` | Tienda **Chapín Store** (`/tienda/chapin-store`), KYC aprobado |
| Dropshipper | `dropshipper2@omniahub.test` | Tienda **Casa Nova GT**, KYC aprobado |
| Dropshipper | `dropshipper3@omniahub.test` | Tienda **Bella Antigua**, KYC aprobado |
| Dropshipper | `nuevo@omniahub.test` | KYC pendiente, para probar la aprobación |
| Transportadora | `rutaexpress@omniahub.test` | RutaExpress |
| Transportadora | `velozgt@omniahub.test` | Veloz GT |
| Cliente | `cliente@omniahub.test` | Con pedidos en distintos estados |

El seed también crea 6 categorías, 20 productos con ilustraciones propias, tarifas para los 22 departamentos, el cupón **`BIENVENIDO10`** (10 %), órdenes en todos los estados con sus transacciones, facturas, reseñas, tickets, banners, las 4 políticas y la configuración (comisión 3 %, retiro mínimo Q100).

## Flujo del dinero

Al crear una orden se calcula:

- **Total** = precio de venta × cantidad − descuento del cupón
- **Comisión de la plataforma** = 3 % del total (configurable por el admin)
- **Ganancia del dropshipper** = total − precio proveedor × cantidad − envío − comisión

Si la ganancia es negativa, la orden no se puede enviar. El saldo **nunca se edita directamente**: cada movimiento es una transacción `ENTRADA` o `SALIDA` con su saldo previo y nuevo.

**Al marcar ENTREGADO** el reparto se hace en una sola transacción de MongoDB (todo o nada):

| Billetera | Con recaudo (contra entrega) | Sin recaudo (prepagado) |
|---|---|---|
| Proveedor | ENTRADA precio proveedor × cantidad | Igual |
| Transportadora | ENTRADA costo de envío | Igual |
| Plataforma (admin) | ENTRADA comisión | Igual |
| Dropshipper | ENTRADA ganancia | Nada: ya cobró a su cliente. Al crear la orden se le descontó una SALIDA por precio proveedor + envío + comisión |

Ejemplo con el cupón `BIENVENIDO10`: 2 audífonos a Q 149 = Q 298, descuento Q 29.80, total **Q 268.20** → proveedor Q 170.00, transportadora Q 25.00, plataforma Q 8.05 y dropshipper Q 65.15.

Otros movimientos:

- **Devolución:** el dropshipper paga el flete (SALIDA del costo de envío) y la transportadora lo recibe; el stock vuelve al inventario.
- **Recarga:** el usuario sube su comprobante y, al aprobarla el admin, recibe una ENTRADA.
- **Retiro:** mínimo Q100 y con KYC aprobado. El monto queda reservado; si el admin aprueba se registra la SALIDA y si rechaza se libera.
- **Stock:** se descuenta al confirmar la orden y se devuelve si se cancela o llega como devolución.

## Cómo probar el flujo completo

1. Entra como **cliente**, abre *Explorar tiendas* → **Chapín Store**, agrega un producto, aplica `BIENVENIDO10` y confirma el pedido.
2. Entra como **dropshipper** → *Mis pedidos* → confirma la orden.
3. Entra como **proveedor** → *Órdenes* → genera la guía.
4. Entra con la **transportadora** elegida → *Guías* → marca en tránsito y luego entregado.
5. Revisa la **billetera** de cada rol (y la del admin): verás la ENTRADA correspondiente a la orden. El cliente ve su factura en *Facturas*.

## Modelo de ramas

```
main      ← versión estable: solo recibe release/v1.0.0 (tag v1.0.0)
 └─ dev   ← integración: recibe cada feature y fix con merge --no-ff
     ├─ feature/backend-base       estructura, modelos, seed, autenticación y KYC
     ├─ feature/backend-negocio    productos, órdenes, envíos, billetera, cupones, POS, reportes, admin
     ├─ feature/frontend-base      layout, componentes UI y autenticación
     ├─ feature/frontend-paneles   paneles de los 5 roles y billetera
     ├─ feature/frontend-tienda    landing, tienda pública, checkout, cookies y políticas
     ├─ feature/extras             tickets, reseñas, favoritos y modo oscuro
     ├─ fix/carrito-checkout       validación del carrito y municipios en el checkout
     ├─ fix/pulido-visual          logo, tiendas, ilustraciones, municipios y explorar tiendas
     └─ release/v1.0.0             revisión final, correcciones y documentación
```

Nunca se programa directo en `main` ni en `dev`. Los commits siguen Conventional Commits en español: `tipo(alcance): descripción` (`feat`, `fix`, `docs`, `chore`…).

## Documentación

- [`docs/API.md`](docs/API.md): todos los endpoints agrupados por módulo.
- [`docs/PROMPTS.md`](docs/PROMPTS.md): los prompts usados para construir el proyecto con IA.
- [`CLAUDE.md`](CLAUDE.md): contexto y reglas del proyecto.
- [`backend/README.md`](backend/README.md) y [`frontend/README.md`](frontend/README.md).
