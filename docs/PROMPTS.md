# OmniaHub — Guía de prompts para Claude Code

Todos los prompts en orden para construir OmniaHub en 3 horas. Cópialos tal cual, uno por uno. Debajo de cada prompt hay una lista **✅ Valida antes de seguir**: no pases al siguiente prompt hasta que todo funcione.

---

## Cómo funciona este método

1. **CLAUDE.md es el cerebro del proyecto.** Claude Code lo lee automáticamente. Ahí están la solicitud, el objetivo, las reglas, los negativos, la salida, las ramas de Git y la forma de validar. Por eso los prompts son cortos: solo dicen **qué parte** hacer.
2. **Las imágenes se pasan por ruta**, por ejemplo `docs/referencias-dropi/07-crear-orden-cliente-transportadora.jpg`.
3. **Un prompt = un módulo = un commit.** Cada bloque vive en su propia rama `feature/*` y al terminar se mezcla en `dev`.
4. **Modo plan para lo grande.** En los prompts 1 y 5, presiona **Shift + Tab** hasta que diga *plan mode*. Claude Code te muestra el plan, lo apruebas y luego lo ejecuta. Después vuelve a *auto mode*.
5. **Valida después de cada prompt.** Si algo falla, arréglalo en ese momento con un prompt de rescate (al final de esta guía). Así no se hace una bola de nieve.
6. **Backend sin subagentes, frontend con subagentes.** Solo el prompt 11 usa subagentes en paralelo, y el 13 usa un subagente revisor.
7. **Agentes y skills del curso.** En `.claude/agents/` hay 3 agentes (`fullstack-web-engineer`, `code-reviewer` y `root-cause-debugger`) y en `.claude/skills/` hay 13 skills (Express, patrones de Node, zod, diseño de API, UI, Tailwind, Vite, depuración, revisión de código, seguridad, verificación y agentes en paralelo). Claude Code los usa solo cuando aplican.
8. Si la conversación se hace muy larga, escribe `/compact`.

**Herramientas para validar:** Postman (para la API), el navegador (para el frontend) y **MongoDB Compass conectado a tu cluster de Atlas** (o Atlas en el navegador → **Browse Collections**) para la base de datos. Después del seed, presiona el botón de refrescar junto a la conexión para ver la base `omniahub`.

---

## Paso 0 — Antes de empezar (ya casi listo)

La carpeta `C:\Users\juanl\proyectos\omniahub` ya tiene CLAUDE.md, `.gitignore`, `docs/PROMPTS.md` y las capturas.

```powershell
cd C:\Users\juanl\proyectos\omniahub
git init
git branch -M main
git remote add origin https://github.com/juanlema-16/OmniaHub.git
claude
```

(Antes crea en github.com el repositorio vacío `OmniaHub`, **sin** README.)

**MongoDB Atlas (hazlo antes de empezar):**
1. Entra a cloud.mongodb.com → tu cluster → **Connect** → **Drivers** → copia la cadena `mongodb+srv://...`
2. Agrega el nombre de la base de datos antes del `?`: `...mongodb.net/omniahub?retryWrites=true&w=majority`
3. En **Network Access**, agrega la IP de la red donde estás (**Add Current IP Address**). Si la red de la academia cambia de IP, usa `0.0.0.0/0` solo durante la prueba.
4. Confirma que recuerdas el usuario y la contraseña de **Database Access**.

Primer mensaje para confirmar que leyó el contexto:
```
¿Qué proyecto vamos a construir según CLAUDE.md? Resúmelo en 5 líneas, incluyendo el modelo de ramas de Git.
```

---

## BLOQUE 1 · Backend base — rama `feature/backend-base` (0:05 – 0:35)

### Prompt 1 — Ramas y estructura (en modo plan)

```
Lee completo CLAUDE.md. Revisa rápidamente las imágenes docs/referencias-dropi/01, 02, 05, 07 y 13 para entender el tipo de plataforma (solo referencia de estructura, no copies marca ni colores).

1. Haz el primer commit en main con CLAUDE.md, .gitignore, la carpeta .claude/ (agentes y skills) y docs/PROMPTS.md: docs: contexto del proyecto, agentes, skills y guía de prompts
2. Crea la rama dev desde main y luego la rama feature/backend-base desde dev
3. En feature/backend-base crea la estructura del monorepo según la sección 3:
   - backend: package.json con scripts dev, start y seed; dependencias del stack; .env.example; app.js y server.js con helmet, cors, rate limit, conexión a MongoDB, errorHandler, ApiError, asyncHandler y GET /api/health
   - frontend: Vite + React con Tailwind, React Router, axios con interceptor de JWT, proxy /api a localhost:4000, fuente Inter y los colores de la sección 9
   - README.md raíz inicial
4. Verifica que ambos arranquen y dame la lista de cómo validarlo
5. Commit: chore: estructura inicial del monorepo
```

**✅ Valida antes de seguir**
- [ ] Copia `backend/.env.example` como `backend/.env` y pon tu cadena de **MongoDB Atlas** (con `/omniahub` antes del `?`)
- [ ] `npm run dev` en `/backend` arranca sin errores
- [ ] Abre `http://localhost:4000/api/health` → responde con `ok: true`
- [ ] `npm run dev` en `/frontend` → `http://localhost:5173` carga
- [ ] `git branch` muestra `main`, `dev` y `* feature/backend-base`

### Prompt 2 — Modelos y seed

```
Crea todos los modelos Mongoose de la sección 7 de CLAUDE.md en backend/src/models, con validaciones, índices y timestamps, y la constante de los 22 departamentos de Guatemala.

Crea backend/src/seed/seed.js con todos los datos de la sección 8 (usuarios, billeteras, categorías, ~20 productos con imágenes placeholder, productos importados en la tienda demo, tarifas de RutaExpress y Veloz GT para los 22 departamentos, cupón BIENVENIDO10, órdenes en distintos estados con historial, transacciones coherentes con los saldos, un banner, las 4 políticas y la configuración).

Ejecuta npm run seed, confirma que funciona y dame la lista de cómo validarlo. Commit: feat(seed): modelos de datos y datos de prueba
```

**✅ Valida antes de seguir**
- [ ] `npm run seed` termina sin errores
- [ ] En **Compass** (refresca la conexión) o en Atlas → Browse Collections: la base de datos `omniahub` tiene las colecciones `users`, `products`, `orders`, `wallets`, `transactions`…
- [ ] `users` muestra **8 documentos** y `products` unos **20** (el total aparece arriba de cada colección)
- [ ] Los saldos de `wallets` coinciden con la suma de sus `transactions`

### Prompt 3 — Autenticación, roles y KYC + merge a dev

```
Implementa el módulo de autenticación según la sección 5 de CLAUDE.md:
- POST /api/auth/register, /verify-email, /resend-code, /login y GET /api/auth/me
- Middlewares auth y authorize(...roles), validación con zod y rate limit en login
- KYC: POST /api/kyc (dpiFrente, dpiReverso y selfie con multer) y GET /api/kyc/me
- Admin: GET /api/admin/kyc?status=pendiente y PATCH /api/admin/kyc/:userId (aprobar o rechazar con motivo), con notificación al usuario
- Middleware requireKyc

Dame la lista de cómo validarlo en Postman. Commit: feat(auth): registro, verificación de correo, login jwt, roles y kyc

Después mezcla feature/backend-base en dev con --no-ff y haz push de main, dev y feature/backend-base.
```

**✅ Valida antes de seguir (Postman)**
- [ ] `POST /api/auth/login` con `dropshipper@omniahub.test` / `Demo123*` → devuelve un token
- [ ] `GET /api/auth/me` con el header `Authorization: Bearer <token>` → devuelve el usuario **sin** password
- [ ] Login con contraseña incorrecta → error 401 con mensaje en español
- [ ] Registro de un usuario nuevo → devuelve `devCode` → `verify-email` con ese código funciona
- [ ] En GitHub se ven las ramas `main`, `dev` y `feature/backend-base`

---

## BLOQUE 2 · Lógica de negocio — rama `feature/backend-negocio` (0:35 – 1:25)

### Prompt 4 — Productos, catálogo, inventario y compras

```
Crea la rama feature/backend-negocio desde dev.

Implementa siguiendo el patrón model → validator → service → controller → route:
1. Productos del proveedor: CRUD con imágenes, precioProveedor, precioSugerido, stock y stockMinimo (requiere KYC aprobado)
2. Catálogo para el dropshipper: búsqueda, filtros (categoría, proveedor, rango de precio, stock) y paginación; detalle de producto; directorio de proveedores
3. Importar producto a la tienda (StoreProduct) con precioVenta ≥ precioProveedor; listar, editar precio y quitar
4. Inventario: movimientos (InventoryMovement) y alerta de stock bajo
5. Compras de mercancía (Purchase) que suman stock y generan movimiento ENTRADA_COMPRA

Dame la lista de cómo validarlo. Commit: feat(products): catálogo, productos importados, inventario y compras
```

**✅ Valida antes de seguir**
- [ ] Como dropshipper: el catálogo devuelve productos y los filtros funcionan
- [ ] Importar un producto con precio de venta **menor** al del proveedor → error 400
- [ ] Como proveedor: registrar una compra sube el stock y crea un movimiento de inventario
- [ ] El dropshipper **no** puede crear productos (error 403)

### Prompt 5 — Órdenes, envíos y billetera (EL MÁS IMPORTANTE, en modo plan)

```
Este es el núcleo de OmniaHub. Lee de nuevo las secciones 6.1, 6.2, 6.3 y 6.4 de CLAUDE.md y muéstrame un plan antes de programar.

Implementa:
1. GET /api/shipping/quote?departamento=X → cotización de ambas transportadoras
2. Preferencia de transportadora por departamento del dropshipper
3. Crear orden (origen PANEL): datos del cliente y destino, items con precioVenta, tipoPago y transportadora. Calcula subtotal, envío, comisión (desde Setting), total y ganancia. Si es SIN_RECAUDO descuenta la SALIDA y falla sin saldo. Crea o actualiza el Customer.
4. Cambios de estado con permisos por rol (6.3), historial completo, descuento y devolución de stock, novedades (reportar y solucionar) y número de guía único
5. services/wallet.service.js con credit() y debit() que siempre crean la Transaction con saldoPrevio y saldoNuevo
6. Al pasar a ENTREGADO: reparto automático con session.withTransaction exactamente como dice 6.4. Al pasar a DEVOLUCION: cobro del flete.
7. Factura automática al entregar y notificaciones en cada cambio de estado
8. Listados de órdenes filtrados por rol, con filtros por estado, fecha, transportadora y búsqueda por guía o teléfono

Prueba el flujo completo con los usuarios del seed y muéstrame una tabla con los saldos de las 4 billeteras antes y después de entregar una orden. Dame la lista de cómo validarlo en Postman. Commit: feat(orders): ciclo de órdenes, envíos, novedades y reparto automático en billeteras
```

**✅ Valida antes de seguir** (este es el más importante, revísalo con calma)
- [ ] La cotización de un departamento devuelve las 2 transportadoras con precio y días
- [ ] Crear una orden CON_RECAUDO calcula bien la ganancia (revisa la cuenta a mano)
- [ ] Una orden con ganancia negativa es rechazada
- [ ] Cada rol solo puede hacer **sus** cambios de estado (prueba uno prohibido → 403)
- [ ] Al pasar a ENTREGADO: las 4 billeteras reciben su ENTRADA y la suma cuadra con el total
- [ ] El stock baja al confirmar y vuelve al cancelar
- [ ] Se generó la factura

### Prompt 6 — Billetera, recargas y retiros

```
Implementa el resto de la billetera según 6.4 de CLAUDE.md:
- GET /api/wallet y GET /api/wallet/transactions con filtros por fecha, tipo y concepto, paginación y exportación CSV
- CRUD de datos bancarios (BankAccount)
- Recargas: solicitud con método y comprobante; el admin aprueba (ENTRADA) o rechaza
- Retiros: mínimo desde Setting, requiere KYC aprobado y saldo suficiente; el monto pasa a saldoReservado; el admin aprueba (SALIDA definitiva) o rechaza (libera el saldo). Historial de retiros.
- Notificaciones y registro en AuditLog

Dame la lista de cómo validarlo. Commit: feat(wallet): recargas, retiros, datos bancarios e historial de movimientos
```

**✅ Valida antes de seguir**
- [ ] Retiro de Q50 → error (mínimo Q100)
- [ ] Retiro de Q100 → el saldo disponible baja y el reservado sube
- [ ] Como admin, aprobar el retiro → aparece la SALIDA en el historial
- [ ] Rechazar un retiro → el dinero vuelve al saldo disponible
- [ ] El usuario `nuevo@omniahub.test` (KYC pendiente) **no** puede retirar

### Prompt 7 — Cupones, POS, reportes, admin y tienda pública + merge a dev

```
Implementa en el backend:
1. Cupones del dropshipper (6.5): CRUD y validación para el checkout
2. Caja y POS del proveedor (6.7): abrir caja, venta POS (descuenta stock y genera factura) y cerrar caja con arqueo
3. Facturas (6.6): listado por rol, detalle y número correlativo
4. Reportes (6.11) por rol y globales para el admin
5. Admin (6.10): usuarios, configuración, transportadoras y tarifas, banners, políticas y auditoría
6. Notificaciones: listar, marcar como leída y contador
7. Endpoints públicos: tienda por slug, banners activos y políticas por slug
8. Checkout público: orden con origen TIENDA, cupón, contraentrega o tarjeta simulada
9. Crea docs/API.md con todos los endpoints agrupados por módulo (método, ruta, rol y descripción)

Dame la lista de cómo validarlo. Commit: feat(backend): cupones, caja pos, facturas, reportes, administración y tienda pública
Luego otro commit: docs(api): documentación de endpoints

Después mezcla feature/backend-negocio en dev con --no-ff y haz push.
```

**✅ Valida antes de seguir**
- [ ] `GET /api/public/stores/chapin-store` (o la ruta que indique) devuelve la tienda y sus productos
- [ ] El cupón `BIENVENIDO10` es válido; un cupón inventado da error
- [ ] Abrir caja → venta POS → cerrar caja muestra el arqueo
- [ ] `docs/API.md` existe y está completo
- [ ] **Punto de control 1:25** — el backend está completo y mezclado en `dev`

---

## BLOQUE 3 · Frontend (1:25 – 2:40)

### Prompt 8 — Base del frontend — rama `feature/frontend-base`

```
Crea la rama feature/frontend-base desde dev.

Revisa docs/referencias-dropi/01-inicio-y-menu-lateral.jpg y 16-menu-perfil.jpg como referencia de estructura.

1. Componentes UI en components/ui: Button, Input, Select, Card, StatCard, Badge (colores por estado de orden), Table (buscador, paginación, estado vacío y skeleton), Modal, Tabs, EmptyState y Timeline
2. DashboardLayout con Sidebar según el rol (íconos lucide) y Header (buscador, saldo de billetera, campana de notificaciones con contador y menú de perfil). Sidebar colapsable en móvil.
3. AuthContext, ProtectedRoute por rol y redirección al panel correcto tras el login
4. Páginas públicas: Login, Registro (con selección de rol), Verificar correo y KYC (subir DPI frente, reverso y selfie con vista previa)
5. Banner "Verifica tu identidad" cuando el KYC no está aprobado
6. Helper formatQ, constantes de estados y validaciones de formularios según la sección 15

Identidad visual de la sección 9. Dame la lista de cómo validarlo. Commit: feat(frontend): layout por rol, componentes ui y autenticación con kyc

Mezcla feature/frontend-base en dev con --no-ff y haz push.
```

**✅ Valida antes de seguir**
- [ ] Entra con cada usuario demo → cada uno llega a **su** panel con **su** menú
- [ ] Un dropshipper que escribe en la URL una ruta de admin es redirigido
- [ ] El header muestra el saldo de la billetera
- [ ] Los formularios muestran errores en español (correo inválido, campos vacíos)
- [ ] Se ve bien en móvil (achica la ventana del navegador)

### Prompt 9 — Panel del dropshipper — rama `feature/frontend-paneles`

```
Crea la rama feature/frontend-paneles desde dev.

Construye el panel del dropshipper. Revisa cada imagen antes de diseñar su pantalla:
1. Dashboard (02 y 03): tarjetas de pedidos generados, entregados, total vendido y ganancia; gráfica con recharts; top productos y top departamentos; filtro por fecha
2. Catálogo (04 y 05): proveedores destacados, buscador, filtros y tarjetas con precio proveedor, precio sugerido, stock y botones "Importar a mi tienda" y "Enviar a cliente"
3. Detalle de producto (06)
4. Modal Crear Orden (07 y 08): 3 columnas (datos del cliente / tipo de pago y transportadoras cotizadas / resumen con ganancia en vivo), validaciones y precio de venta editable
5. Mis pedidos (09, 10 y 11): tabla con filtros, badge de estado y detalle con línea de tiempo; confirmar o cancelar
6. Novedades (12): lista y formulario para solucionarlas
7. Mis productos importados, Mi tienda (nombre, logo y link público), Cupones, Clientes y Transportadora favorita por departamento (18)

Dame la lista de cómo validarlo. Commit: feat(frontend): panel del dropshipper con catálogo, crear orden y pedidos
```

**✅ Valida antes de seguir**
- [ ] Crea una orden desde el modal: al elegir el departamento aparecen las 2 transportadoras con precio
- [ ] La ganancia cambia en vivo al cambiar el precio de venta o la cantidad
- [ ] La orden aparece en "Mis pedidos" con su línea de tiempo
- [ ] Crear un cupón y verlo en la lista

### Prompt 10 — Billetera (todos los roles)

```
Revisa 13-billetera-historial.jpg, 14-billetera-recarga.jpg y 15-retiros-de-saldo.jpg.

Crea las páginas de billetera, compartidas por proveedor, dropshipper, transportadora y admin:
- Tarjetas de saldo disponible y saldo reservado
- Historial con filtros por fecha y tipo (ENTRADA en verde, SALIDA en rojo), columnas monto, saldo previo, saldo nuevo, concepto y descripción, y Exportar CSV
- Recargar saldo: método, monto y comprobante
- Retiros: formulario (monto, cuenta, concepto) e historial con estado
- Datos bancarios: agregar, editar y eliminar

Dame la lista de cómo validarlo. Commit: feat(frontend): billetera con historial, recargas, retiros y datos bancarios
```

**✅ Valida antes de seguir**
- [ ] El historial muestra las transacciones del seed con sus colores
- [ ] Solicitar un retiro desde la pantalla y verlo como pendiente
- [ ] El CSV se descarga y se abre bien

### Prompt 11 — Proveedor, transportadora y admin (con 2 subagentes en paralelo)

```
Ahora vamos a usar subagentes para avanzar más rápido. Lanza 2 subagentes en paralelo del tipo fullstack-web-engineer (está en .claude/agents). Cada uno debe leer CLAUDE.md, reutilizar los componentes de components/ui y el layout existente, trabajar SOLO en su carpeta de pages/ y NO hacer commits ni tocar App.jsx:

SUBAGENTE 1 — frontend/src/pages/proveedor/
- Dashboard (ventas, órdenes por preparar, stock bajo y gráfica)
- Mis productos (CRUD con imágenes), Inventario (movimientos y stock bajo) y Compras de mercancía
- Órdenes por preparar con botón "Generar guía"
- Caja y POS: abrir caja, punto de venta (buscador, carrito, método de pago, cobrar e imprimir factura) y cerrar caja con arqueo

SUBAGENTE 2 — frontend/src/pages/transportadora/ y frontend/src/pages/admin/
- Transportadora: guías asignadas con filtros y acciones En tránsito, Reportar novedad (con motivo), Entregado (confirmando el monto recaudado si es contraentrega) y Devolución
- Admin: dashboard global, usuarios (bloquear), revisión de KYC con imágenes (aprobar o rechazar con motivo), recargas y retiros pendientes, todas las órdenes (corregir estado), transportadoras y tarifas, configuración, banners, políticas y auditoría

Cuando ambos terminen, tú (el orquestador) conecta sus rutas en App.jsx y en el Sidebar, agrega las páginas de Reportes y Facturas (ver 19-facturas.jpg) para los roles que corresponda, revisa que todo compile y haz un commit por panel:
- feat(frontend): panel del proveedor con inventario, compras y caja pos
- feat(frontend): panel de transportadora y panel de administración
- feat(frontend): reportes y facturas por rol

Dame la lista de cómo validarlo. Luego mezcla feature/frontend-paneles en dev con --no-ff y haz push.
```

**✅ Valida antes de seguir**
- [ ] **Proveedor:** generar la guía de una orden pendiente; hacer una venta en el POS e imprimir la factura
- [ ] **Transportadora:** marcar una guía en tránsito y luego entregada
- [ ] **Admin:** aprobar el KYC de `nuevo@omniahub.test` y aprobar el retiro que hiciste antes
- [ ] Las billeteras reflejan el reparto después de la entrega

### Prompt 12 — Parte pública — rama `feature/frontend-tienda`

```
Crea la rama feature/frontend-tienda desde dev.

1. Landing de OmniaHub: hero con el eslogan "El centro donde proveedores, emprendedores y transportadoras se conectan para vender", cómo funciona (los 5 roles), beneficios, banners activos, botones a registro y login, y footer con las políticas
2. Tienda pública /tienda/:slug: nombre y logo de la tienda, grilla de productos, detalle y carrito (CartContext)
3. Checkout: datos de envío, cotización y selección de transportadora, cupón, método de pago (contraentrega o tarjeta simulada) y confirmación con número de orden
4. Panel del cliente: mis pedidos con línea de tiempo y facturas
5. Banner de cookies (Aceptar todas / Solo necesarias) en localStorage
6. Páginas de políticas desde la API

Dame la lista de cómo validarlo. Commit: feat(store): landing, tienda pública, checkout, panel del cliente, cookies y políticas

Mezcla feature/frontend-tienda en dev con --no-ff y haz push.
```

**✅ Valida antes de seguir**
- [ ] `http://localhost:5173/tienda/chapin-store` muestra los productos
- [ ] Compra completa con el cupón `BIENVENIDO10` → aparece el número de orden
- [ ] La orden aparece en el panel del dropshipper y del cliente
- [ ] El banner de cookies aparece una sola vez

---

## BLOQUE EXTRA · Extras — rama `feature/extras`

### Prompt 12B — Tickets de soporte, reseñas, favoritos y modo oscuro

```
Crea la rama feature/extras desde dev. Implementa los 4 extras de la sección 6.12 de CLAUDE.md, cada uno completo (backend + frontend) y con su propio commit, siguiendo el patrón y los componentes existentes:

1. Tickets de soporte
   - Backend: modelo Ticket, crear, listar los míos, ver detalle, responder, y para el admin listar todos con filtros (estado, prioridad, categoría), responder y cambiar estado. Notificación a la otra parte en cada respuesta.
   - Frontend: página "Soporte" en el menú de todos los roles (lista + crear ticket + vista de conversación tipo chat) y bandeja de tickets en el panel del admin.
   - Commit: feat(tickets): sistema de tickets de soporte con conversación y estados

2. Reseñas
   - Backend: modelo Review, crear (solo cliente con orden ENTREGADA de ese producto, una vez por producto y orden), listar por producto, promedio y cantidad en catálogo y tienda pública, y ocultar para el admin. Agrega 6-8 reseñas al seed.
   - Frontend: estrellas y promedio en las tarjetas y el detalle de producto (tienda y catálogo), lista de reseñas en el detalle, botón "Calificar" en los pedidos entregados del cliente, y moderación en el admin.
   - Commit: feat(reviews): reseñas con calificación de productos entregados

3. Favoritos
   - Backend: modelo Favorite, marcar/desmarcar y filtro favoritos=true en el catálogo.
   - Frontend: corazón en las tarjetas del catálogo y el interruptor "Solo favoritos" (ver docs/referencias-dropi/04-catalogo-encabezado-filtros.jpg).
   - Commit: feat(favorites): productos favoritos en el catálogo del dropshipper

4. Modo oscuro
   - Interruptor sol/luna en el header y en la tienda pública, guardado en localStorage y con la preferencia del sistema como valor inicial. Revisa TODAS las pantallas, componentes, modales, tablas y gráficas para que se vean bien en oscuro.
   - Commit: feat(ui): modo oscuro en toda la aplicación

Actualiza docs/API.md con los endpoints nuevos (commit docs(api): endpoints de tickets, reseñas y favoritos). Dame la lista de cómo validar cada extra. Luego mezcla feature/extras en dev con --no-ff y haz push.
```

**✅ Valida antes de seguir**
- [ ] **Tickets:** como dropshipper crea un ticket; como admin respóndelo y cámbialo a RESUELTO; el dropshipper ve la respuesta y la notificación
- [ ] **Reseñas:** como `cliente@omniahub.test`, califica un producto de un pedido entregado; las estrellas aparecen en la tienda. Intentar calificarlo otra vez da error
- [ ] **Favoritos:** marca 2 productos con el corazón y activa "Solo favoritos" → solo salen esos 2
- [ ] **Modo oscuro:** actívalo y recorre dashboard, catálogo, modal de orden, billetera, POS y tienda pública; recarga la página y debe seguir en oscuro

---

## BLOQUE 4 · Release — rama `release/v1.0.0` (2:40 – 3:00)

### Prompt 13 — Revisión final con subagente revisor y entrega

```
Crea la rama release/v1.0.0 desde dev.

1. Lanza el subagente code-reviewer (está en .claude/agents), que no ha visto el código. Debe leer CLAUDE.md y revisar el código contra las reglas de negocio (sección 6, sobre todo el reparto de la billetera en 6.4), la seguridad (sección 5), los negativos (sección 13) y la salida (sección 14). Debe devolver una lista de problemas ordenados por gravedad, sin corregirlos.
2. Mientras tanto, tú recorre el flujo completo con los usuarios del seed llamando a la API (y revisa también tickets, reseñas, favoritos y modo oscuro): cliente compra en la tienda chapin-store con el cupón BIENVENIDO10 → el dropshipper confirma → el proveedor genera la guía → la transportadora marca en tránsito y entregado → verifica las transacciones de las 4 billeteras y la factura.
3. Corrige cada problema encontrado con un commit fix por cada uno, usando la skill verification-before-completion antes de dar algo por arreglado.
4. Revisa que no queden console.log ni código muerto.
5. Completa el README.md raíz según la sección 14 y los README de backend y frontend. Commit: docs: readme completo con instalación, usuarios demo y flujo del dinero
6. Mezcla release/v1.0.0 en main con --no-ff, crea el tag v1.0.0, mezcla release/v1.0.0 de vuelta en dev y haz push de todas las ramas y del tag.
7. Muéstrame git log --oneline --graph --all para ver el historial.
```

**✅ Valida antes de entregar**
- [ ] Haz tú mismo el flujo completo una vez más, cambiando de usuario
- [ ] En GitHub: ramas `main`, `dev`, las 6 `feature/*` y `release/v1.0.0`, y el tag `v1.0.0`
- [ ] El README tiene instalación y usuarios demo
- [ ] El `.env` **no** está en GitHub

---

## Prompts de rescate

**Error difícil que no se arregla al primer intento:**
```
Usa el subagente root-cause-debugger para encontrar la causa real de este problema: [describe qué pasa y pega el error]. Que lo reproduzca, encuentre la causa y la corrija sin romper lo demás. Luego haz commit con fix.
```

**Error en consola o terminal:**
```
Me sale este error al [hacer X]. Encuentra la causa, explícamela en una frase y corrígela sin romper lo que ya funciona. Haz commit con fix:
[pega el error aquí]
```

**Una pantalla no se parece a la referencia:**
```
La pantalla [nombre] no sigue la estructura de docs/referencias-dropi/[imagen].jpg. Revisa la imagen otra vez y ajusta la distribución, sin copiar marca ni colores de Dropi.
```

**Algo funciona a medias:**
```
En [módulo], [qué pasa] pero debería [qué esperas] según la sección [X] de CLAUDE.md. Corrígelo y haz commit con fix.
```

**Me perdí con las ramas:**
```
Muéstrame en qué rama estoy, si hay cambios sin commit y el historial con git log --oneline --graph --all. Explícame en una frase cómo seguir según la sección 11 de CLAUDE.md.
```

**Para entender lo que hizo (para la explicación):**
```
Explícame en palabras simples cómo funciona [el reparto de la billetera / los estados / la autenticación], qué archivos intervienen y en qué orden.
```

---

## Plan B: si vas atrasado

| Hora | Debería estar listo | Si no lo está… |
|---|---|---|
| 0:35 | Prompts 1, 2 y 3 | Junta los prompts 6 y 7 en uno solo |
| 1:25 | Backend completo y en `dev` | Deja POS, compras y auditoría para el final |
| 2:10 | Prompts 8, 9 y 10 | En el prompt 11 haz solo transportadora y KYC del admin |
| 2:40 | Prompts 11 y 12 | Salta al prompt 13: **el flujo completo funcionando vale más que una pantalla extra** |

**Nunca debe faltar:** login por roles, catálogo, crear orden con transportadora, cambio de estados, reparto en billeteras, tienda con checkout, ramas con merges, commits limpios y README.

---

## Guion para la explicación final

1. **Solicitud y objetivo:** OmniaHub, plataforma de dropshipping inspirada en Dropi para Guatemala, con 5 roles. Stack Node + Express + MongoDB y React + Vite + Tailwind.
2. **Demo del flujo estrella** (cambiando de usuario): cliente compra → dropshipper confirma → proveedor genera la guía → transportadora entrega → mostrar las 4 billeteras.
3. **Puntos técnicos:** backend y frontend separados, arquitectura por capas, JWT y roles, KYC, transacciones de MongoDB para que el dinero nunca quede a medias, saldo calculado por transacciones.
4. **Metodología con IA:** CLAUDE.md organizado con los 8 puntos (solicitud, objetivo, reglas, negativos, salida, git, testing y validación); prompts por módulo; imágenes de referencia; modo plan para lo complejo; subagentes solo en el frontend y un revisor al final.
5. **Git:** mostrar `git log --oneline --graph --all` con `main`, `dev`, las ramas feature, el release y el tag.
6. **Validación:** después de cada prompt se probó todo antes de avanzar, para que los errores no se acumularan.
