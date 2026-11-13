# OmniaHub — Contexto del proyecto para Claude Code

> **OmniaHub: el centro donde proveedores, emprendedores y transportadoras se conectan para vender.**

Este archivo es la fuente de verdad del proyecto. Léelo completo antes de escribir código y respétalo en cada tarea.

### Índice según la metodología del curso

| Punto | Dónde está |
|---|---|
| 1. Solicitud (qué se quiere lograr y con qué tecnología) | Secciones 1 y 2 |
| 2. Objetivo | Sección 0 |
| 3. Reglas | Secciones 4, 5, 6, 9, 10 y 12 |
| 4. Negativos (lo que NO se debe hacer) | Sección 13 |
| 5. Salida (lo que se entrega) | Sección 14 |
| 6. Git (ramas main / dev / feature) | Sección 11 |
| 7 y 8. Testing y validación | Sección 15 |

---

## 0. Objetivo

Construir en **3 horas** una plataforma web **completa y profesional** de dropshipping y e-commerce, separada en **backend (API REST)** y **frontend (SPA)**, donde **5 roles** (admin, proveedor, dropshipper, transportadora y cliente) trabajan sobre un mismo flujo de pedidos y dinero.

**El proyecto está terminado cuando:**
1. Cada rol puede registrarse o iniciar sesión y ve su propio panel.
2. Funciona el **flujo completo de punta a punta**: un cliente compra en la tienda de un dropshipper → el dropshipper confirma → el proveedor genera la guía → la transportadora entrega → el dinero se reparte automáticamente en las 4 billeteras y se genera la factura.
3. Están todos los módulos: login, dashboard, catálogo, inventario, compras, proveedores, clientes, órdenes, envíos, novedades, billetera (recargas y retiros), cupones, caja/POS, facturación, reportes, KYC, publicidad, políticas y cookies, más los extras: tickets de soporte, reseñas, favoritos y modo oscuro.
4. El historial de Git muestra ramas `main`, `dev` y `feature/*` con commits convencionales.
5. Cualquier persona puede instalarlo y probarlo siguiendo el README, con los usuarios demo del seed.

---

## 1. Qué es OmniaHub

OmniaHub es una plataforma de **dropshipping y e-commerce** para **Guatemala** (moneda: **Quetzales, Q**), inspirada en el funcionamiento de Dropi. Conecta a cinco tipos de usuarios en un mismo flujo de pedidos y dinero:

1. Un **proveedor** publica productos con **precio proveedor** y **precio sugerido**.
2. Un **dropshipper** importa esos productos a su **tienda en línea**, pone su **precio de venta** y vende.
3. Un **cliente** compra en la tienda del dropshipper (o el dropshipper crea la orden manualmente).
4. Una **transportadora** recibe la guía, entrega el pedido y actualiza los estados.
5. Al marcarse **ENTREGADO**, el dinero se reparte automáticamente en las **billeteras** de proveedor, dropshipper, transportadora y plataforma (**admin**).

Debe verse y sentirse como un producto hecho por una empresa: profesional, consistente, completo y sin pantallas a medias.

### Referencias visuales
En `docs/referencias-dropi/` hay capturas del panel de Dropi. Úsalas **solo como referencia de estructura, flujo y distribución**. **Nunca copies el logo, la marca, los nombres ni los colores de Dropi.** Usa siempre la identidad de OmniaHub (sección 9).

| Imagen | Pantalla |
|---|---|
| 01-inicio-y-menu-lateral.jpg | Layout general: sidebar + header con saldo |
| 02-dashboard-metricas.jpg | Tarjetas de métricas del dashboard |
| 03-dashboard-graficas-y-tops.jpg | Gráfica de rendimiento + tops |
| 04-catalogo-encabezado-filtros.jpg | Catálogo: proveedores destacados y filtros |
| 05-catalogo-tarjetas-producto.jpg | Tarjetas de producto (precio proveedor / sugerido / stock) |
| 06-detalle-producto.jpg | Detalle de producto |
| 07-crear-orden-cliente-transportadora.jpg | Modal Crear Orden (3 columnas) |
| 08-crear-orden-precio-venta.jpg | Precio de venta editable + cantidad |
| 09-lista-pedidos-columnas.jpg | Tabla de pedidos |
| 10-pedidos-filtros.jpg | Filtros de pedidos |
| 11-pedidos-estados.jpg | Estados de pedido |
| 12-novedades.jpg | Novedades |
| 13-billetera-historial.jpg | Historial de billetera (ENTRADA / SALIDA) |
| 14-billetera-recarga.jpg | Recarga de saldo |
| 15-retiros-de-saldo.jpg | Retiros de saldo |
| 16-menu-perfil.jpg | Menú de perfil |
| 17-proveedores.jpg | Directorio de proveedores |
| 18-transportadoras-preferencias.jpg | Transportadora favorita |
| 19-facturas.jpg | Facturas |

---

## 2. Stack tecnológico

**Backend** (`/backend`)
- Node.js + Express
- **MongoDB Atlas** (en la nube) + Mongoose. La conexión va en `MONGODB_URI` del `.env` con formato `mongodb+srv://…/omniahub`. No se usa MongoDB local ni mongosh: las validaciones de datos se hacen en Atlas → Browse Collections.
- Las transacciones de MongoDB (`session.withTransaction`) funcionan en Atlas porque el cluster es un replica set.
- Autenticación: JWT (access token) + bcryptjs
- Validación: zod
- Seguridad: helmet, cors, express-rate-limit
- Archivos: multer (guardados en `backend/uploads/`)
- Variables de entorno: dotenv (`.env` + `.env.example`)
- Puerto: **4000**, prefijo de rutas: **`/api`**

**Frontend** (`/frontend`)
- React + Vite
- React Router
- Tailwind CSS
- Axios (instancia con interceptor que agrega el JWT)
- lucide-react (íconos), recharts (gráficas), react-hot-toast (notificaciones)
- Puerto: **5173**, con proxy de Vite de `/api` hacia `http://localhost:4000`

Frontend y backend están **completamente separados**: cada uno tiene su propio `package.json`, su `.env` y su README.

---

## 3. Estructura de carpetas

```
omniahub/
├── CLAUDE.md
├── README.md
├── .gitignore
├── .claude/
│   ├── agents/                   (agentes del curso, si se agregan)
│   └── skills/                   (skills del curso, si se agregan)
├── docs/
│   ├── PROMPTS.md
│   ├── API.md                    (lista de endpoints)
│   └── referencias-dropi/        (ignorada por git)
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js             (arranque)
│       ├── app.js                (express, middlewares, rutas)
│       ├── config/               (db.js, env.js)
│       ├── models/               (un archivo por modelo Mongoose)
│       ├── routes/               (un archivo por módulo)
│       ├── controllers/          (reciben req/res, llaman a services)
│       ├── services/             (lógica de negocio: órdenes, billetera, envíos…)
│       ├── middlewares/          (auth, roles, validate, errorHandler, upload)
│       ├── validators/           (esquemas zod)
│       ├── utils/                (ApiError, asyncHandler, generadores de códigos)
│       └── seed/                 (seed.js con datos de prueba)
└── frontend/
    ├── package.json
    └── src/
        ├── main.jsx / App.jsx
        ├── api/                  (axios + un archivo por módulo)
        ├── context/              (AuthContext, CartContext)
        ├── components/
        │   ├── layout/           (DashboardLayout, Sidebar, Header)
        │   └── ui/               (Button, Card, Table, Modal, Badge, Input, StatCard, EmptyState…)
        ├── pages/
        │   ├── public/           (Landing, Login, Register, Tienda, Checkout, Políticas…)
        │   ├── admin/
        │   ├── proveedor/
        │   ├── dropshipper/
        │   ├── transportadora/
        │   └── cliente/
        ├── routes/               (ProtectedRoute por rol)
        └── utils/                (formatQ para moneda, fechas, constantes de estados)
```

**Patrón obligatorio por módulo del backend:** `model → validator → service → controller → route`. Cuando se pida un módulo nuevo, copia exactamente el patrón de los módulos ya existentes.

---

## 4. Roles y permisos

| Rol (`role`) | Qué hace |
|---|---|
| `admin` | Dueño de la plataforma. Aprueba KYC, recargas y retiros. Configura comisión, transportadoras, banners y políticas. Ve reportes globales. Puede corregir estados de envío (queda en auditoría). |
| `proveedor` | Publica productos (precio proveedor + sugerido), maneja inventario y compras de mercancía, recibe y prepara órdenes, vende en físico con **Caja/POS**. |
| `dropshipper` | Explora el catálogo, importa productos a su tienda con su precio de venta, crea órdenes, maneja cupones, clientes y su tienda en línea. |
| `transportadora` | Ve las guías asignadas, actualiza estados, reporta novedades, confirma cobros contraentrega. |
| `cliente` | Compra en la tienda pública de un dropshipper, ve sus pedidos, seguimiento y facturas. |

Cada rol tiene su propio panel con el **mismo layout** (sidebar + header); solo cambian las opciones del menú. Las rutas del backend se protegen con `auth` + `authorize(...roles)`.

---

## 5. Registro, verificación y seguridad

1. **Registro**: nombre, apellido, correo, teléfono (+502), contraseña y rol (proveedor, dropshipper o cliente). Admin y transportadora se crean desde el seed o por el admin.
2. **Verificación de correo**: se genera un código de 6 dígitos con vencimiento de 15 minutos. En desarrollo, el código se imprime en la consola del backend y se devuelve en la respuesta (`devCode`) para la demo.
3. **KYC (verificación de identidad)**: proveedor y dropshipper suben **DPI frente, DPI reverso y selfie con el DPI**. El estado queda en `pendiente` hasta que el admin lo **aprueba** o **rechaza con motivo**.
4. **Reglas**:
   - El cliente solo necesita correo verificado para comprar.
   - Proveedor y dropshipper necesitan **KYC aprobado** para publicar o vender y para **retirar dinero**. Mientras tanto ven un banner "Verifica tu identidad".
5. **Seguridad**: contraseñas con bcrypt, JWT con expiración, middleware de roles, validación con zod en todas las entradas, helmet, CORS limitado al frontend, rate limit en login (5 intentos / 15 min), nunca devolver el campo password.

Estados de cuenta (`accountStatus`): `pendiente_email` → `activo` / `bloqueado`.
Estado de KYC (`kyc.status`): `no_enviado` → `pendiente` → `aprobado` / `rechazado`.

---

## 6. Reglas de negocio

### 6.1 Precios y ganancia
- El proveedor define `precioProveedor` y `precioSugerido`.
- El dropshipper define `precioVenta` al importar el producto o al crear una orden. **Validación: `precioVenta` ≥ `precioProveedor`**.
- **Comisión de la plataforma**: porcentaje configurable por el admin (por defecto **3%** del total de la orden).
- **Ganancia del dropshipper** = `total venta − (precioProveedor × cantidad) − costoEnvio − comisión`.
- El modal de crear orden muestra el resumen en vivo: total a recaudar, precio proveedor, envío, comisión y **ganancia** (en verde; en rojo si es negativa, y en ese caso no permite enviar).

### 6.2 Envíos y transportadoras
- Hay 2 transportadoras simuladas: **RutaExpress** y **Veloz GT** (nombres inventados). Cada una tiene un usuario con rol `transportadora` y **tarifas por departamento** (precio y días estimados).
- Al crear una orden se ingresan los datos del destinatario: nombres, apellidos, teléfono, **departamento, municipio, dirección, referencias** y correo opcional.
- Al elegir el departamento, el sistema **cotiza** ambas transportadoras y el usuario elige una.
- **Tipo de pago**:
  - `CON_RECAUDO` (contraentrega): el cliente paga al recibir. La transportadora confirma el monto cobrado.
  - `SIN_RECAUDO` (prepagado): al crear la orden se descuenta una **SALIDA** de la billetera del dropshipper por `precioProveedor + envío + comisión`. Si no tiene saldo suficiente, no se puede crear.
- Al generar la guía se crea un **número de guía** único (ej. `OH-2026-000123`).
- El dropshipper puede elegir su **transportadora favorita por departamento** (preselección).

### 6.3 Estados de la orden
`PENDIENTE_CONFIRMACION → PENDIENTE → GUIA_GENERADA → EN_TRANSITO → ENTREGADO`
Estados alternos: `NOVEDAD`, `DEVOLUCION`, `CANCELADO`.

- Quién cambia qué:
  - Dropshipper: confirma (`PENDIENTE_CONFIRMACION → PENDIENTE`) o cancela antes de la guía.
  - Proveedor: prepara y genera la guía (`PENDIENTE → GUIA_GENERADA`).
  - Transportadora: `EN_TRANSITO`, `NOVEDAD`, `ENTREGADO`, `DEVOLUCION`.
  - Admin: puede corregir cualquier estado (queda registrado en auditoría).
- Cada cambio se guarda en `historial` (estado, fecha, usuario, nota) y se muestra como **línea de tiempo**.
- **Novedad**: la transportadora indica el motivo ("Cliente ausente", "Dirección incorrecta", "Rechazó el pedido"…). El dropshipper la soluciona (nueva dirección o nota) y la orden vuelve a `EN_TRANSITO`.
- **Inventario**: el stock se **descuenta al confirmar** la orden y se **devuelve** si se cancela o llega `DEVOLUCION`.

### 6.4 Billetera (wallet)
- Cada usuario (excepto cliente) tiene billetera con `saldoDisponible`.
- **El saldo nunca se edita directamente.** Todo cambio es una **transacción** (`ENTRADA` o `SALIDA`) que guarda `monto`, `saldoPrevio`, `saldoNuevo`, `concepto`, `descripcion` y la orden relacionada.
- **Reparto al marcar ENTREGADO** (dentro de una **transacción de MongoDB** con `session.withTransaction`, todo o nada):
  - `CON_RECAUDO`:
    - Proveedor: ENTRADA `precioProveedor × cantidad`
    - Transportadora: ENTRADA `costoEnvio`
    - Plataforma (admin): ENTRADA `comisión`
    - Dropshipper: ENTRADA `ganancia`
  - `SIN_RECAUDO` (la SALIDA del dropshipper ya se hizo al crear):
    - Proveedor, transportadora y plataforma reciben su ENTRADA igual que arriba.
    - Dropshipper: no recibe nada; ya cobró directamente a su cliente.
- **DEVOLUCION**: el dropshipper paga el flete → SALIDA `costoEnvio` a su billetera y ENTRADA a la transportadora. Se devuelve el stock.
- **Recargas**: el usuario elige método (transferencia bancaria con comprobante, o tarjeta simulada), sube el comprobante y el admin aprueba → ENTRADA.
- **Retiros**: el usuario registra sus **datos bancarios** (banco, tipo de cuenta, número, titular). Solicita un retiro con **monto mínimo Q100** y concepto. El monto queda reservado; el admin aprueba (SALIDA definitiva) o rechaza (se libera).
- **Historial de movimientos** con filtros por fecha y tipo, y exportación a Excel/CSV.
- Conceptos de transacción: `VENTA_ENTREGADA`, `PAGO_PROVEEDOR`, `PAGO_ENVIO`, `COMISION_PLATAFORMA`, `ORDEN_SIN_RECAUDO`, `FLETE_DEVOLUCION`, `RECARGA`, `RETIRO`, `AJUSTE_ADMIN`.

### 6.5 Cupones
- Los crea el dropshipper para su tienda: código, tipo (`PORCENTAJE` o `FIJO`), valor, compra mínima, usos máximos, fecha de vencimiento y activo/inactivo.
- Se validan en el checkout. El descuento sale de la ganancia del dropshipper.

### 6.6 Facturación
- Toda orden entregada y toda venta POS genera una **factura** con número correlativo (`FAC-000001`), emisor, receptor (nombre y NIT o "CF"), detalle, subtotal, descuento, total y fecha.
- Se puede ver e imprimir (vista imprimible o PDF).

### 6.7 Caja y POS (proveedor)
- **Abrir caja** con monto inicial.
- **POS**: buscar producto, agregar al carrito, cantidad, método de pago (efectivo o tarjeta), cobrar → descuenta stock, genera factura y venta.
- **Cerrar caja**: muestra el monto esperado vs el monto contado (arqueo) y la diferencia.

### 6.8 Inventario y compras (proveedor)
- Movimientos de inventario: `ENTRADA_COMPRA`, `SALIDA_VENTA`, `AJUSTE`, `DEVOLUCION`.
- **Compras**: el proveedor registra compras de mercancía (proveedor de origen, productos, cantidades, costo) → suma stock.
- Alerta de **stock bajo** cuando `stock ≤ stockMinimo`.

### 6.9 Tienda en línea (pública)
- Cada dropshipper tiene su tienda en `/tienda/:slug` con su nombre, logo y los productos que importó, a su precio de venta.
- Carrito, cupón y checkout con datos de envío y transportadora. El cliente puede pagar contraentrega o con tarjeta simulada.
- La compra crea una orden con `origen: TIENDA`.

### 6.10 Admin
- Dashboard global: ventas, comisiones ganadas, órdenes por estado, usuarios por rol.
- Usuarios: listar, bloquear o desbloquear, revisar y aprobar KYC.
- Recargas y retiros pendientes: aprobar o rechazar.
- Configuración: % de comisión, monto mínimo de retiro.
- Transportadoras y tarifas.
- **Publicidad**: banners (imagen, título, enlace, fechas, activo) que aparecen en el inicio de los paneles y en la landing.
- **Políticas**: páginas editables (Términos y condiciones, Privacidad, Cookies, Envíos y devoluciones).
- Auditoría: quién hizo qué y cuándo.

### 6.11 Otros obligatorios
- **Banner de cookies** en la parte pública (Aceptar todas / Solo necesarias), guardado en localStorage.
- **Notificaciones** internas (campanita en el header): nueva orden, novedad, KYC aprobado, retiro aprobado…
- **Reportes**: ventas por período, productos más vendidos, órdenes por estado, ganancias. Con gráficas y exportación CSV.
- **Landing pública** que explica la plataforma con botones a registro y login.

### 6.12 Extras (obligatorios en esta versión)
- **Tickets de soporte:** cualquier usuario autenticado crea un ticket (asunto, categoría `PEDIDO` | `PAGO` | `CUENTA` | `TECNICO` | `OTRO`, prioridad `BAJA` | `MEDIA` | `ALTA`, mensaje inicial y orden relacionada opcional). Es una conversación con mensajes del usuario y del admin. Estados: `ABIERTO → EN_PROCESO → RESUELTO → CERRADO`. El admin ve todos, responde y cambia el estado; el usuario solo ve los suyos. Cada respuesta notifica a la otra parte.
- **Reseñas:** solo un cliente con una orden **ENTREGADA** que incluya ese producto puede reseñarlo, **una vez por producto y orden**: calificación de 1 a 5 estrellas y comentario. En la tienda pública y en el catálogo se muestran el promedio y la cantidad de reseñas. El admin puede ocultar una reseña inapropiada.
- **Favoritos:** el dropshipper marca o desmarca productos del catálogo con un corazón. En el catálogo hay un interruptor "Solo favoritos" (ver `04-catalogo-encabezado-filtros.jpg`).
- **Modo oscuro:** interruptor en el header (sol/luna), guardado en localStorage y, la primera vez, según la preferencia del sistema. Se aplica a **todas** las pantallas (paneles, tienda pública, modales, tablas, gráficas) con la variante `dark:` de Tailwind, manteniendo buen contraste.

---

## 7. Modelo de datos (colecciones Mongoose)

- **User**: nombre, apellido, email (único), telefono, password, role, accountStatus, emailVerification {code, expiresAt}, kyc {status, dpiFrente, dpiReverso, selfie, motivoRechazo, revisadoPor, revisadoEn}, tienda {nombre, slug, logo} (dropshipper), empresa {nombre, nit, bodega} (proveedor y transportadora), avatar, timestamps.
- **Wallet**: user (único), saldoDisponible, saldoReservado.
- **Transaction**: wallet, user, tipo (`ENTRADA` | `SALIDA`), concepto, monto, saldoPrevio, saldoNuevo, descripcion, order, createdBy.
- **Category**: nombre, slug, icono.
- **Product**: proveedor, nombre, sku (único), descripcion, categoria, imagenes[], precioProveedor, precioSugerido, stock, stockMinimo, bodega (municipio), activo, verificado.
- **StoreProduct** (producto importado): dropshipper, product, precioVenta, activo. Índice único (dropshipper, product).
- **Order**: numero, origen (`PANEL` | `TIENDA`), dropshipper, proveedor, cliente {user?, nombres, apellidos, telefono, email}, destino {departamento, municipio, direccion, referencias}, items[{product, nombre, imagen, cantidad, precioProveedor, precioVenta}], tipoPago, transportadora, costoEnvio, subtotal, descuento, cupon, comision, total, gananciaDropshipper, guia, estado, historial[{estado, nota, usuario, fecha}], novedad {motivo, solucion, activa}, montoRecaudado, notasProveedor.
- **Carrier** (transportadora): nombre, logo, user, tarifas[{departamento, precio, dias}], activa.
- **CarrierPreference**: dropshipper, departamento, carrier.
- **Coupon**: dropshipper, codigo, tipo, valor, minimoCompra, usosMaximos, usos, venceEn, activo.
- **Customer**: dropshipper, nombres, apellidos, telefono, email, direccion, departamento, municipio, totalPedidos.
- **Invoice**: numero, order?, posSale?, emisor, receptor {nombre, nit}, items, subtotal, descuento, total, fecha.
- **BankAccount**: user, banco, tipoCuenta, numeroCuenta, titular.
- **TopUp** (recarga): user, monto, metodo, comprobante, estado (`PENDIENTE` | `APROBADA` | `RECHAZADA`), motivo.
- **Withdrawal** (retiro): user, monto, bankAccount, concepto, estado, motivo, revisadoPor.
- **InventoryMovement**: product, tipo, cantidad, stockPrevio, stockNuevo, referencia, user.
- **Purchase** (compra de mercancía): proveedor, origen, items[{product, cantidad, costo}], total.
- **CashSession** (caja): proveedor, montoInicial, abiertaEn, cerradaEn, montoEsperado, montoContado, diferencia, estado.
- **PosSale**: proveedor, cashSession, items, total, metodoPago, invoice.
- **Notification**: user, titulo, mensaje, tipo, leida, link.
- **Banner**: titulo, imagen, link, ubicacion, inicio, fin, activo.
- **Policy**: slug, titulo, contenido, actualizadoEn.
- **Setting**: key, value (comisionPorcentaje, montoMinimoRetiro).
- **AuditLog**: user, accion, entidad, entidadId, detalle, fecha.
- **Ticket**: numero (`TCK-000001`), user, asunto, categoria, prioridad, estado, order?, mensajes[{autor, rol, texto, fecha}], cerradoEn.
- **Review**: product, cliente, order, rating (1-5), comentario, visible. Índice único (cliente, product, order).
- **Favorite**: dropshipper, product. Índice único (dropshipper, product).

Departamentos de Guatemala (22) en una constante compartida: Alta Verapaz, Baja Verapaz, Chimaltenango, Chiquimula, El Progreso, Escuintla, Guatemala, Huehuetenango, Izabal, Jalapa, Jutiapa, Petén, Quetzaltenango, Quiché, Retalhuleu, Sacatepéquez, San Marcos, Santa Rosa, Sololá, Suchitepéquez, Totonicapán, Zacapa.

---

## 8. Datos de prueba (seed)

`npm run seed` en `/backend` borra y crea todo de nuevo. Contraseña de todos los usuarios demo: **`Demo123*`**

| Rol | Correo |
|---|---|
| admin | admin@omniahub.test |
| proveedor | proveedor@omniahub.test (KYC aprobado) |
| proveedor | proveedor2@omniahub.test (KYC aprobado) |
| dropshipper | dropshipper@omniahub.test (KYC aprobado, tienda "Tienda Demo", slug `tienda-demo`) |
| dropshipper | nuevo@omniahub.test (KYC pendiente, para mostrar la aprobación) |
| transportadora | rutaexpress@omniahub.test |
| transportadora | velozgt@omniahub.test |
| cliente | cliente@omniahub.test |

El seed también crea: 6 categorías, unos 20 productos con imágenes de placeholder, productos importados en la tienda demo, tarifas de las 2 transportadoras para los 22 departamentos, cupón `BIENVENIDO10` (10%), órdenes en distintos estados, transacciones de billetera coherentes, un banner, las 4 políticas y la configuración (comisión 3%, retiro mínimo Q100).

---

## 9. Identidad visual de OmniaHub

- Nombre: **OmniaHub**. Logo: ícono de hexágono o nodos conectados + texto "OmniaHub".
- Color principal: **índigo `#4F46E5`** (hover `#4338CA`). Acento de ganancias: **verde `#10B981`**. Alertas: ámbar `#F59E0B`. Error: rojo `#EF4444`.
- Fondo de paneles: gris muy claro `#F8FAFC`, tarjetas blancas con borde suave y `rounded-xl`, sombras ligeras.
- Tipografía: Inter (Google Fonts).
- Sidebar blanco con íconos lucide y el ítem activo resaltado en índigo claro. Header con buscador, **saldo de billetera**, campana de notificaciones y menú de perfil.
- Badges de estado de orden con colores consistentes (definidos una sola vez en `utils/constants`).
- Moneda siempre con formato `Q 1,234.50` (helper `formatQ`).
- Todas las tablas con: buscador, filtros, paginación, estado vacío ("No hay resultados") y estado de carga (skeleton).
- Responsive: el sidebar se colapsa en móvil.
- Todo el texto de la interfaz en **español**.

---

## 10. Convenciones de código

- JavaScript con ES Modules (`"type": "module"`) en el backend.
- Nombres de variables y funciones en camelCase; modelos en PascalCase; archivos de componentes React en PascalCase.
- Respuestas de la API con formato uniforme: `{ ok: true, data, message }` o `{ ok: false, message, errors }`.
- Errores con una clase `ApiError(status, message)` y un `errorHandler` central.
- Controladores envueltos con `asyncHandler`.
- Paginación estándar: `?page=1&limit=10` → `{ items, total, page, pages }`.
- No dejar `console.log` de depuración ni código comentado.
- Comentarios breves solo donde la lógica no sea obvia (por ejemplo, el reparto de la billetera).

---

## 11. Git: ramas y Conventional Commits (obligatorio)

### Modelo de ramas

```
main      ← versión estable y entregable. Solo recibe merges desde dev al final.
 └─ dev   ← rama de integración. Recibe los merges de cada feature.
     ├─ feature/backend-base       (estructura, modelos, seed, autenticación y KYC)
     ├─ feature/backend-negocio    (productos, órdenes, envíos, billetera, cupones, POS, reportes, admin)
     ├─ feature/frontend-base      (layout, componentes UI, autenticación)
     ├─ feature/frontend-paneles   (paneles de los 5 roles y billetera)
     ├─ feature/frontend-tienda    (landing, tienda pública, checkout, cookies, políticas)
     ├─ feature/extras             (tickets de soporte, reseñas, favoritos y modo oscuro)
     └─ release/v1.0.0             (prueba final, correcciones, README y API.md → se mezcla en main y en dev)
```

**Reglas de ramas:**
- **Nunca** se programa directamente en `main` ni en `dev`.
- Cada feature nace de `dev` actualizado: `git checkout dev && git checkout -b feature/nombre`.
- Al terminar una feature: `git checkout dev && git merge --no-ff feature/nombre -m "merge: feature/nombre en dev"`. El `--no-ff` deja visible la rama en el historial.
- Al final del proyecto se crea `release/v1.0.0` desde `dev` para la prueba final y las correcciones. Luego: `git checkout main && git merge --no-ff release/v1.0.0 -m "release: omniahub v1.0.0"`, `git tag v1.0.0`, y también se mezcla de vuelta en `dev`.
- Después de cada merge a `dev` se hace `git push` para tener respaldo en GitHub.
- Las ramas feature **no se borran**, para que se vean en GitHub.
- Se suben todas las ramas al remoto: `git push -u origin main dev` y cada `feature/*`.

### Commits
- **Un commit por cada módulo o paso terminado**, nunca un commit gigante al final.
- Formato: `tipo(alcance): descripción en español, en minúscula y sin punto final`
- Tipos: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`
- Alcances sugeridos: `backend`, `frontend`, `auth`, `kyc`, `products`, `orders`, `shipping`, `wallet`, `coupons`, `invoices`, `pos`, `inventory`, `admin`, `store`, `reports`, `seed`
- Ejemplos:
  - `chore: estructura inicial del monorepo`
  - `feat(auth): registro, login con jwt y verificación de correo`
  - `feat(orders): crear orden con cotización de transportadora`
  - `feat(wallet): reparto automático de ganancias al entregar`
  - `fix(orders): validar que el precio de venta no sea menor al del proveedor`
  - `docs: readme con instrucciones de instalación`
- Al terminar cada tarea: muestra el resumen de lo hecho y **haz el commit** con el mensaje correcto.

---

## 12. Forma de trabajar

1. Antes de una tarea grande, presenta un plan breve y después ejecútalo.
2. Reutiliza los componentes de `components/ui` y el patrón de módulos existente; no dupliques código.
3. Después de cada módulo, verifica que el backend arranque sin errores y que el frontend compile.
4. Si una imagen de referencia está indicada en el prompt, revísala antes de diseñar esa pantalla.
5. Prioridad absoluta: que el **flujo completo** (registro → producto → orden → guía → entrega → reparto en billeteras) funcione de punta a punta.
6. **Subagentes:** el backend se hace en la sesión principal, sin subagentes, porque sus partes dependen mucho entre sí. En el frontend se pueden usar subagentes en paralelo solo cuando el prompt lo indique, y cada uno trabaja **únicamente en su propia carpeta** de `pages/`.
7. Agentes y skills del curso en `.claude/`: usa `fullstack-web-engineer` para los subagentes del frontend, `code-reviewer` para la revisión final y `root-cause-debugger` para errores difíciles. Las skills (Express, Node, zod, diseño de API, UI, Tailwind, Vite, depuración, revisión, seguridad, verificación y agentes en paralelo) úsalas cuando apliquen. **Si algo de un agente o skill contradice este CLAUDE.md, manda CLAUDE.md** (por ejemplo: nada de TypeScript ni shadcn).

---

## 13. Negativos (lo que NO se debe hacer)

- **No** copiar el logo, la marca, los colores ni los nombres de Dropi. Las capturas son solo referencia de estructura.
- **No** conectar APIs reales de pagos, bancos, transportadoras ni verificación de identidad. Todo eso se **simula**.
- **No** usar datos personales reales: nombres, DPI, teléfonos y correos del seed son inventados.
- **No** modificar `saldoDisponible` directamente: todo movimiento de dinero pasa por `wallet.service` y crea una Transaction.
- **No** guardar ni devolver contraseñas en texto plano.
- **No** subir `.env`, `node_modules`, `uploads` ni `docs/referencias-dropi` al repositorio.
- **No** trabajar directo en `main` ni en `dev`, ni hacer commits gigantes con muchos módulos juntos.
- **No** cambiar el stack ni instalar librerías fuera de la sección 2 sin una razón clara (nada de TypeScript, Next.js, Redux ni librerías de UI pesadas).
- **No** agregar funcionalidades fuera del alcance de este documento ni dejar pantallas "en construcción".
- **No** avanzar al siguiente módulo si el actual no arranca o tiene errores.
- **No** dejar `console.log` de depuración, código comentado, `TODO` ni archivos sin usar.
- **No** mezclar la lógica de negocio en controladores ni en componentes React: va en `services` (backend) y en `api/` + hooks (frontend).

---

## 14. Salida (lo que se entrega)

1. **Repositorio en GitHub** `juanlema-16/OmniaHub` (https://github.com/juanlema-16/OmniaHub) con las ramas `main`, `dev` y `feature/*`, el tag `v1.0.0` y commits convencionales.
2. **`/backend`**: API REST funcional con su `package.json`, `.env.example`, README propio y `npm run seed`.
3. **`/frontend`**: aplicación React funcional con su `package.json`, `.env.example` y README propio.
4. **README.md raíz** con: descripción, objetivo, roles, funcionalidades, stack, arquitectura, instalación paso a paso, variables de entorno, usuarios demo, flujo del dinero y modelo de ramas.
5. **`docs/API.md`**: lista de endpoints agrupados por módulo (método, ruta, rol que puede usarla y descripción breve).
6. **`docs/PROMPTS.md`**: los prompts usados para construir el proyecto con IA.
7. **CLAUDE.md**: el contexto del proyecto.

---

## 15. Testing y validación

La validación es **manual y continua**: después de cada prompt, la persona desarrolladora comprueba que lo construido funciona **antes** de avanzar, para que los errores no se acumulen.

Por eso, al terminar cada tarea, Claude Code debe:
1. Confirmar que el backend arranca sin errores (`npm run dev` en `/backend`) y que el frontend compila (`npm run dev` en `/frontend`).
2. Entregar una **lista corta de cómo probar** lo que acaba de hacer: qué URL abrir, con qué usuario demo entrar, o qué endpoint llamar con qué datos y qué respuesta esperar.
3. Esperar la confirmación antes del siguiente módulo si algo falló.

Las validaciones de **datos** son obligatorias en las dos capas:
- **Backend:** esquemas zod en todos los endpoints que reciben datos, más las reglas de negocio de la sección 6 (precio de venta ≥ precio proveedor, saldo suficiente, KYC aprobado, stock disponible, permisos por rol, cupón vigente, monto mínimo de retiro).
- **Frontend:** campos obligatorios, formato de correo y teléfono (8 dígitos), números positivos, mensajes de error en español debajo de cada campo y botones deshabilitados mientras se envía.
