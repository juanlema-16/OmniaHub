# OmniaHub — API REST

Base URL: `http://localhost:4000/api`

## Convenciones

- **Autenticación:** `Authorization: Bearer <token>`. El token se obtiene con `POST /auth/login` o `POST /auth/verify-email`.
- **Respuestas:** éxito `{ ok: true, data, message }`; error `{ ok: false, message, errors }`. `errors` trae `[{ campo, mensaje }]` cuando falla la validación.
- **Paginación:** `?page=1&limit=10` → `data: { items, total, page, pages }`.
- **Fechas en filtros:** `desde` y `hasta` en formato `AAAA-MM-DD` (el día `hasta` se incluye completo).
- **Archivos:** las rutas con *(multipart)* reciben `multipart/form-data`. Imágenes JPG, PNG o WEBP de hasta 5 MB (los comprobantes también aceptan PDF).
- **Moneda:** todos los montos están en quetzales (Q) con 2 decimales.
- **Códigos:** `400` datos o regla de negocio inválida · `401` sin sesión · `403` sin permiso o KYC pendiente · `404` no existe o no es tuyo · `409` duplicado · `429` demasiados intentos.

**Roles:** `admin`, `proveedor`, `dropshipper`, `transportadora`, `cliente`. "Autenticado" = cualquier rol con sesión. **KYC** = el proveedor o dropshipper necesita KYC aprobado.

---

## Salud

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado de la API y de la conexión con MongoDB Atlas |

## Autenticación

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Público | Registro de proveedor, dropshipper o cliente. Crea la billetera y envía un código de 6 dígitos (en desarrollo vuelve en `devCode`) |
| POST | `/auth/verify-email` | Público | Verifica el correo con el código (vence en 15 min) y devuelve el token |
| POST | `/auth/resend-code` | Público | Genera un código nuevo e invalida el anterior |
| POST | `/auth/login` | Público | Inicio de sesión. Límite: 5 intentos fallidos cada 15 min por IP |
| GET | `/auth/me` | Autenticado | Usuario actual y resumen de su billetera |

## KYC (verificación de identidad)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/kyc` *(multipart)* | proveedor, dropshipper | Envía `dpiFrente`, `dpiReverso` y `selfie`. Queda en `pendiente` |
| GET | `/kyc/me` | proveedor, dropshipper | Estado de mi verificación y motivo de rechazo |
| GET | `/kyc/archivo/:archivo` | Dueño o admin | Imagen privada de un documento KYC |

## Categorías

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/categories` | Público | Categorías con la cantidad de productos activos |

## Productos (proveedor)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/products/mine` | proveedor | Mis productos. Filtros: `search`, `categoria`, `activo`, `stockBajo` |
| GET | `/products/:id` | proveedor, dropshipper, admin | Detalle con precio proveedor (el proveedor solo ve los suyos). El cliente usa el detalle de la tienda, que nunca muestra ese precio |
| POST | `/products` *(multipart)* | proveedor + KYC | Publica un producto con hasta 5 `imagenes`. El stock inicial queda como movimiento `AJUSTE` |
| PATCH | `/products/:id` *(multipart)* | proveedor + KYC | Edita datos, agrega `imagenes` o quita con `imagenesEliminar` (JSON). Cambiar el stock genera un `AJUSTE` |
| DELETE | `/products/:id` | proveedor + KYC | Desactiva el producto y lo retira de las tiendas (no se borra para conservar el historial) |

## Catálogo (dropshipper)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/catalog` | dropshipper, admin | Productos de proveedores verificados. Filtros: `search`, `categoria` (id o slug), `proveedor`, `precioMin`, `precioMax`, `conStock`, `stockMin`, `verificado`, `favoritos` (solo mis favoritos), `orden` (`recientes`, `precio_asc`, `precio_desc`, `stock_desc`, `nombre`). Cada producto indica si ya está `importado`, si es `favorito` y su `rating` (`{ promedio, cantidad }`) |
| GET | `/catalog/proveedores` | dropshipper, admin | Directorio de proveedores con productos, categorías y bodega |
| GET | `/catalog/:id` | dropshipper, admin | Detalle con proveedor, productos relacionados y estado de importación |

## Productos importados (tienda del dropshipper)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/store-products` | dropshipper | Productos de mi tienda con su `margen`. Filtros: `search`, `activo` |
| POST | `/store-products` | dropshipper + KYC | Importa un producto. `precioVenta` ≥ precio proveedor (por defecto, el sugerido) |
| PATCH | `/store-products/:id` | dropshipper + KYC | Cambia `precioVenta` o `activo` |
| DELETE | `/store-products/:id` | dropshipper | Quita el producto de la tienda |

## Mi tienda y clientes (dropshipper)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/my-store` | dropshipper | Nombre, slug, logo y resumen de mi tienda (productos activos y ventas desde la tienda) |
| PATCH | `/my-store` *(multipart)* | dropshipper | Cambia `nombre`, sube `logo` (imagen de hasta 2 MB) o lo quita con `quitarLogo`. El slug no cambia para no romper el link público |
| GET | `/customers` | dropshipper | Mis clientes (se crean solos con cada orden). Filtros: `search` (nombre, teléfono o correo), `departamento` |

## Inventario (proveedor)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/inventory/movements` | proveedor | Movimientos de mis productos. Filtros: `product`, `tipo`, `desde`, `hasta` |
| GET | `/inventory/low-stock` | proveedor | Productos con `stock ≤ stockMinimo` |
| POST | `/inventory/adjust` | proveedor + KYC | Ajuste manual `{ product, cantidad (±), motivo }`. No permite stock negativo |

## Compras de mercancía (proveedor)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/purchases` | proveedor | Mis compras. Filtros: `search` (origen), `desde`, `hasta` |
| GET | `/purchases/:id` | proveedor | Detalle de una compra |
| POST | `/purchases` | proveedor + KYC | Registra `{ origen, items: [{ product, cantidad, costo }], notas }`. Suma stock con movimientos `ENTRADA_COMPRA` |

## Envíos

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/shipping/quote?departamento=X` | Público | Cotiza las transportadoras activas (precio, días, más barata, más rápida). Con token de dropshipper marca su `preferida` |
| GET | `/shipping/carriers` | Público | Transportadoras activas con sus tarifas |
| GET | `/shipping/preferences` | dropshipper | Mis transportadoras favoritas por departamento |
| PUT | `/shipping/preferences` | dropshipper | Define la favorita `{ departamento, carrier }` |
| DELETE | `/shipping/preferences/:departamento` | dropshipper | Elimina la favorita de un departamento |

## Órdenes

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/orders/preview` | dropshipper | Resumen en vivo: total a recaudar, precio proveedor, envío, comisión y ganancia (aunque sea negativa) |
| POST | `/orders` | dropshipper + KYC | Crea una orden (origen `PANEL`); el `destino.municipio` debe pertenecer al departamento. `SIN_RECAUDO` descuenta producto + envío + comisión de la billetera. Crea o actualiza el cliente |
| GET | `/orders` | Autenticado | Órdenes según el rol, con conteo `porEstado`. Filtros: `estado` (uno o varios separados por coma), `desde`, `hasta`, `transportadora`, `tipoPago`, `origen`, `novedad`, `search` (número, guía, teléfono o nombre) |
| GET | `/orders/:id` | Autenticado | Detalle con historial (línea de tiempo) |
| PATCH | `/orders/:id/status` | dropshipper, proveedor, transportadora, admin | Cambia el estado `{ estado, nota, motivo, montoRecaudado }`. Ver tabla de permisos abajo |
| POST | `/orders/:id/novedad/solucion` | dropshipper | Soluciona una novedad `{ solucion, direccion?, referencias?, telefono? }` y la orden vuelve a `EN_TRANSITO` |

**Quién cambia qué estado:**

| Rol | De | A |
|---|---|---|
| dropshipper | `PENDIENTE_CONFIRMACION` | `PENDIENTE` (descuenta stock) o `CANCELADO` |
| dropshipper | `PENDIENTE` | `CANCELADO` (devuelve stock; reembolsa si era `SIN_RECAUDO`) |
| proveedor | `PENDIENTE` | `GUIA_GENERADA` (crea la guía `OH-AAAA-000000`) |
| transportadora | `GUIA_GENERADA` | `EN_TRANSITO` |
| transportadora | `EN_TRANSITO` | `ENTREGADO`, `NOVEDAD` (requiere `motivo`) o `DEVOLUCION` |
| transportadora | `NOVEDAD` | `DEVOLUCION` |
| admin | Cualquiera | Cualquiera, con `nota` obligatoria y registro en auditoría. No puede sacar una orden de `ENTREGADO` |

Al pasar a **`ENTREGADO`** el dinero se reparte en una transacción de MongoDB: proveedor (precio proveedor × cantidad), transportadora (envío), plataforma (comisión) y, si es `CON_RECAUDO`, dropshipper (ganancia). También se genera la factura. Si el cliente pagó en efectivo, la transportadora debe enviar `montoRecaudado` igual al total. Con tarjeta no se envía.

Al pasar a **`DEVOLUCION`**: se devuelve el stock y la transportadora recibe el flete. En `CON_RECAUDO` el flete se descuenta al dropshipper; en `SIN_RECAUDO` se le reembolsan el producto y la comisión.

## Billetera

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/wallet` | admin, proveedor, dropshipper, transportadora | Saldo disponible, reservado y total; entradas, salidas, pendientes y retiro mínimo |
| GET | `/wallet/transactions` | ídem | Historial de movimientos con `totales`. Filtros: `desde`, `hasta`, `tipo`, `concepto`, `search` (descripción, número de orden o guía) |
| GET | `/wallet/transactions/export` | ídem | Mismo historial en CSV (con BOM para Excel) |
| GET | `/wallet/topups` | proveedor, dropshipper, transportadora | Mis recargas. Filtro: `estado` |
| POST | `/wallet/topups` *(multipart)* | proveedor, dropshipper, transportadora | Solicita una recarga `{ monto, metodo: TRANSFERENCIA \| TARJETA }`. Con transferencia el `comprobante` es obligatorio |
| GET | `/wallet/withdrawals` | proveedor, dropshipper, transportadora | Historial de retiros. Filtro: `estado` |
| POST | `/wallet/withdrawals` | proveedor, dropshipper, transportadora + KYC | Solicita un retiro `{ monto, bankAccount, concepto }`. Mínimo desde la configuración. El monto pasa a saldo reservado |
| GET | `/wallet/comprobantes/:archivo` | Dueño o admin | Comprobante privado de una recarga |

## Datos bancarios

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/bank-accounts` | proveedor, dropshipper, transportadora | Mis cuentas |
| POST | `/bank-accounts` | ídem | Registra `{ banco, tipoCuenta, numeroCuenta, titular }` (máximo 5) |
| PATCH | `/bank-accounts/:id` | ídem | Edita una cuenta (no si tiene un retiro pendiente) |
| DELETE | `/bank-accounts/:id` | ídem | Elimina una cuenta (no si tiene un retiro pendiente) |

## Cupones (dropshipper)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/coupons` | dropshipper | Mis cupones con `estadoActual` (`VIGENTE`, `VENCIDO`, `AGOTADO`, `INACTIVO`). Filtros: `search`, `activo` |
| POST | `/coupons` | dropshipper + KYC | Crea `{ codigo, tipo: PORCENTAJE \| FIJO, valor, minimoCompra, usosMaximos, venceEn, activo }` |
| PATCH | `/coupons/:id` | dropshipper + KYC | Edita un cupón |
| DELETE | `/coupons/:id` | dropshipper | Elimina; si ya se usó, lo desactiva |

## Caja y POS (proveedor)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/pos/cash/current` | proveedor + KYC | Caja abierta con arqueo en vivo (ventas, efectivo, tarjeta, monto esperado) |
| POST | `/pos/cash/open` | proveedor + KYC | Abre caja `{ montoInicial }` (solo una a la vez) |
| POST | `/pos/cash/close` | proveedor + KYC | Cierra caja `{ montoContado }`: calcula esperado, contado y diferencia |
| GET | `/pos/cash/sessions` | proveedor + KYC | Historial de cajas |
| GET | `/pos/sales` | proveedor + KYC | Ventas POS. Filtros: `cashSession`, `desde`, `hasta` |
| POST | `/pos/sales` | proveedor + KYC | Cobra `{ items: [{ product, cantidad, precio? }], metodoPago: EFECTIVO \| TARJETA, cliente?: { nombre, nit } }`. Descuenta stock y genera factura |

## Facturas

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/invoices` | admin, dropshipper, proveedor, cliente | Facturas emitidas (dropshipper, proveedor), recibidas (cliente) o todas (admin). Filtros: `search`, `origen` (`ORDEN` \| `POS`), `desde`, `hasta` |
| GET | `/invoices/export` | ídem | Facturas en CSV con los mismos filtros del listado, sin paginación |
| GET | `/invoices/:id` | ídem | Detalle para ver o imprimir (número correlativo `FAC-000001`) |

## Reportes

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/reports/summary` | admin, dropshipper, proveedor, transportadora | KPIs del rol, órdenes por estado, serie diaria y productos más vendidos (el dropshipper también ve sus departamentos con más entregas). El admin también ve usuarios por rol, comisiones, pendientes y mejores tiendas. Período: `desde`, `hasta` (por defecto, últimos 30 días) |
| GET | `/reports/orders/export` | ídem | Órdenes en CSV, con columnas según el rol. Acepta los mismos filtros que `GET /orders` (`estado`, `desde`, `hasta`, `transportadora`, `tipoPago`, `origen`, `novedad`, `search`), sin paginación |

## Notificaciones

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/notifications` | Autenticado | Mis notificaciones con `noLeidas`. Filtros: `leida`, `tipo` |
| GET | `/notifications/unread-count` | Autenticado | Contador para la campana |
| PATCH | `/notifications/read-all` | Autenticado | Marca todas como leídas |
| PATCH | `/notifications/:id/read` | Autenticado | Marca una como leída |

## Tienda pública

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/store/:slug` | Público | Datos de la tienda y sus productos a precio de venta con su `rating` (nunca muestra el precio proveedor). Filtros: `search`, `categoria`, `orden` |
| GET | `/store/:slug/products/:productId` | Público | Detalle de un producto de la tienda |
| GET | `/store/mine` | cliente | Tiendas donde el cliente ya compró (con `pedidos` y `ultimaCompra`), la más reciente primero |
| POST | `/store/:slug/cart/validate` | Público | Revisa un carrito `{ items: [{ product, cantidad }] }` y devuelve, por producto, `disponible`, `motivo` (`NO_DISPONIBLE` \| `AGOTADO`), `nombre`, `imagen`, `precio` y `stock` actuales para que el navegador lo actualice |
| POST | `/store/:slug/coupon` | Público | Valida un cupón contra el carrito `{ codigo, items }` y devuelve el descuento |
| POST | `/store/:slug/checkout` | cliente | Crea una orden con origen `TIENDA` (el `destino.municipio` debe pertenecer al `departamento`) `{ destino, items, transportadora, metodoPago: CONTRAENTREGA \| TARJETA, cupon?, cliente? }`. Los precios salen de la tienda, no del navegador |

## Contenido público

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/public/banners?ubicacion=LANDING\|PANEL&rol=` | Público | Banners activos y vigentes. En `PANEL` con `rol` devuelve los dirigidos a ese rol o a todos; sin `rol`, solo los dirigidos a todos. `LANDING` es pública y no distingue roles |
| GET | `/public/stores?search=&orden=nombre|destacadas&page=&limit=` | Público | Directorio de tiendas activas con KYC aprobado y al menos un producto: `nombre`, `slug`, `logo`, `productos` y `rating { promedio, cantidad }` (reseñas visibles de sus productos). `orden=destacadas` pone primero las mejor calificadas. Paginado |
| GET | `/public/municipios` | Público | Los 340 municipios agrupados por departamento. Es la lista que valida el backend y que usan los selectores del frontend |
| GET | `/public/policies` | Público | Lista de políticas |
| GET | `/public/policies/:slug` | Público | `terminos-y-condiciones`, `privacidad`, `cookies` o `envios-y-devoluciones` |

## Tickets de soporte

Cualquier usuario autenticado. Cada usuario solo ve sus tickets; el admin ve todos. Estados: `ABIERTO` → `EN_PROCESO` → `RESUELTO` → `CERRADO`. Categorías: `PEDIDO`, `PAGO`, `CUENTA`, `TECNICO`, `OTRO`. Prioridades: `BAJA`, `MEDIA`, `ALTA`.

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/tickets` | Autenticado | Mis tickets (el admin, todos) con `porEstado` para las pestañas. Filtros: `estado`, `prioridad`, `categoria`, `search` (número, asunto y, para el admin, usuario) |
| POST | `/tickets` | Autenticado | Crea un ticket `{ asunto, categoria, prioridad?, mensaje, order? }`. `order` debe ser una orden propia. Avisa a los admins |
| GET | `/tickets/:id` | Dueño o admin | Conversación completa |
| POST | `/tickets/:id/messages` | Dueño o admin | Responde `{ texto }`. El admin que responde pasa `ABIERTO` a `EN_PROCESO`; si el usuario responde un `RESUELTO`, se reabre. No se responde un ticket `CERRADO`. Notifica a la otra parte |
| PATCH | `/tickets/:id/status` | Dueño o admin | Cambia el estado `{ estado }`. El admin elige cualquiera (queda en auditoría); el usuario solo puede `CERRADO` |

## Reseñas

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/reviews/products/:productId` | Público | Reseñas visibles de un producto con `resumen` (`promedio`, `cantidad`, `distribucion` por estrellas). El autor se muestra como "Nombre A." |
| POST | `/reviews` | cliente | Califica `{ product, order, rating (1-5), comentario }`. Solo si la orden es del cliente, está `ENTREGADO` e incluye el producto; una vez por producto y orden (`409` si se repite) |
| GET | `/reviews/mine` | cliente | Mis reseñas, para saber qué productos de mis pedidos faltan por calificar |
| GET | `/reviews` | admin | Todas las reseñas para moderar. Filtros: `visible`, `rating`, `search` |
| PATCH | `/reviews/:id` | admin | Oculta o muestra una reseña `{ visible }` (queda en auditoría). Las ocultas no cuentan en el promedio |

## Favoritos (dropshipper)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/favorites` | dropshipper | Ids de mis productos favoritos |
| PUT | `/favorites/:productId` | dropshipper | Marca un producto como favorito (idempotente) |
| DELETE | `/favorites/:productId` | dropshipper | Lo desmarca (idempotente) |

El catálogo acepta `favoritos=true` para mostrar solo los favoritos.

## Administración

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/admin/users` | admin | Usuarios con su saldo. Filtros: `role`, `accountStatus`, `kyc`, `search` |
| POST | `/admin/users` | admin | Crea un usuario `admin` o `transportadora` (esta última con su transportadora y tarifas iniciales) |
| GET | `/admin/users/:id` | admin | Detalle con billetera y estadísticas |
| PATCH | `/admin/users/:id/status` | admin | Bloquea (con `motivo`) o desbloquea una cuenta |
| GET | `/admin/kyc` | admin | Verificaciones. Filtros: `status` (por defecto `pendiente`), `search` |
| PATCH | `/admin/kyc/:userId` | admin | `{ accion: aprobar \| rechazar, motivo }`. Notifica al usuario |
| GET | `/admin/topups` | admin | Recargas. Filtros: `estado`, `search` |
| PATCH | `/admin/topups/:id` | admin | Aprueba (crea una `ENTRADA RECARGA`) o rechaza con motivo |
| GET | `/admin/withdrawals` | admin | Retiros con datos bancarios. Filtros: `estado`, `search` |
| PATCH | `/admin/withdrawals/:id` | admin | Aprueba (`SALIDA RETIRO` desde el reservado) o rechaza (libera el saldo) |
| GET | `/admin/settings` | admin | Configuración actual |
| PUT | `/admin/settings` | admin | `{ comisionPorcentaje (0-30), montoMinimoRetiro }` |
| GET | `/admin/carriers` | admin | Transportadoras con tarifas y usuario |
| PATCH | `/admin/carriers/:id` | admin | `{ nombre, logo, activa }` |
| PUT | `/admin/carriers/:id/tarifas` | admin | `{ tarifas: [{ departamento, precio, dias }] }`. Solo cambia los departamentos enviados |
| GET | `/admin/banners` | admin | Todos los banners |
| POST | `/admin/banners` *(multipart)* | admin | Crea un banner con `imagen` (archivo) o `imagenUrl`, `titulo`, `subtitulo`, `link`, `ubicacion`, `roles` (lista separada por comas; vacío = todos los roles), `inicio`, `fin`, `activo` |
| PATCH | `/admin/banners/:id` *(multipart)* | admin | Edita un banner. Para quitar la fecha de fin se envía `fin` vacío (multipart) o `null` (JSON) |
| DELETE | `/admin/banners/:id` | admin | Elimina un banner |
| GET | `/admin/policies` | admin | Políticas con quién las actualizó |
| PUT | `/admin/policies/:slug` | admin | `{ titulo?, contenido }` |
| GET | `/admin/audit` | admin | Auditoría. Filtros: `accion`, `entidad`, `user`, `desde`, `hasta` |
