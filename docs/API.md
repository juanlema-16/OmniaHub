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
| GET | `/products/:id` | Autenticado | Detalle (el proveedor solo ve los suyos) |
| POST | `/products` *(multipart)* | proveedor + KYC | Publica un producto con hasta 5 `imagenes`. El stock inicial queda como movimiento `AJUSTE` |
| PATCH | `/products/:id` *(multipart)* | proveedor + KYC | Edita datos, agrega `imagenes` o quita con `imagenesEliminar` (JSON). Cambiar el stock genera un `AJUSTE` |
| DELETE | `/products/:id` | proveedor + KYC | Desactiva el producto y lo retira de las tiendas (no se borra para conservar el historial) |

## Catálogo (dropshipper)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/catalog` | dropshipper, admin | Productos de proveedores verificados. Filtros: `search`, `categoria` (id o slug), `proveedor`, `precioMin`, `precioMax`, `conStock`, `stockMin`, `verificado`, `orden` (`recientes`, `precio_asc`, `precio_desc`, `stock_desc`, `nombre`). Cada producto indica si ya está `importado` |
| GET | `/catalog/proveedores` | dropshipper, admin | Directorio de proveedores con productos, categorías y bodega |
| GET | `/catalog/:id` | dropshipper, admin | Detalle con proveedor, productos relacionados y estado de importación |

## Productos importados (tienda del dropshipper)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/store-products` | dropshipper | Productos de mi tienda con su `margen`. Filtros: `search`, `activo` |
| POST | `/store-products` | dropshipper + KYC | Importa un producto. `precioVenta` ≥ precio proveedor (por defecto, el sugerido) |
| PATCH | `/store-products/:id` | dropshipper + KYC | Cambia `precioVenta` o `activo` |
| DELETE | `/store-products/:id` | dropshipper | Quita el producto de la tienda |

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
| POST | `/orders` | dropshipper + KYC | Crea una orden (origen `PANEL`). `SIN_RECAUDO` descuenta producto + envío + comisión de la billetera. Crea o actualiza el cliente |
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
| GET | `/invoices/:id` | ídem | Detalle para ver o imprimir (número correlativo `FAC-000001`) |

## Reportes

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/reports/summary` | admin, dropshipper, proveedor, transportadora | KPIs del rol, órdenes por estado, serie diaria y productos más vendidos. El admin también ve usuarios por rol, comisiones, pendientes y mejores tiendas. Período: `desde`, `hasta` (por defecto, últimos 30 días) |
| GET | `/reports/orders/export` | ídem | Órdenes del período en CSV, con columnas según el rol. Filtro: `estado` |

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
| GET | `/store/:slug` | Público | Datos de la tienda y sus productos a precio de venta (nunca muestra el precio proveedor). Filtros: `search`, `categoria`, `orden` |
| GET | `/store/:slug/products/:productId` | Público | Detalle de un producto de la tienda |
| POST | `/store/:slug/coupon` | Público | Valida un cupón contra el carrito `{ codigo, items }` y devuelve el descuento |
| POST | `/store/:slug/checkout` | cliente | Crea una orden con origen `TIENDA` `{ destino, items, transportadora, metodoPago: CONTRAENTREGA \| TARJETA, cupon?, cliente? }`. Los precios salen de la tienda, no del navegador |

## Contenido público

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/public/banners?ubicacion=LANDING\|PANEL` | Público | Banners activos y vigentes |
| GET | `/public/policies` | Público | Lista de políticas |
| GET | `/public/policies/:slug` | Público | `terminos-y-condiciones`, `privacidad`, `cookies` o `envios-y-devoluciones` |

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
| POST | `/admin/banners` *(multipart)* | admin | Crea un banner con `imagen` (archivo) o `imagenUrl`, `titulo`, `subtitulo`, `link`, `ubicacion`, `inicio`, `fin`, `activo` |
| PATCH | `/admin/banners/:id` *(multipart)* | admin | Edita un banner |
| DELETE | `/admin/banners/:id` | admin | Elimina un banner |
| GET | `/admin/policies` | admin | Políticas con quién las actualizó |
| PUT | `/admin/policies/:slug` | admin | `{ titulo?, contenido }` |
| GET | `/admin/audit` | admin | Auditoría. Filtros: `accion`, `entidad`, `user`, `desde`, `hasta` |
