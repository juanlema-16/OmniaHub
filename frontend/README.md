# OmniaHub — Frontend

SPA de OmniaHub construida con React, Vite, Tailwind CSS y React Router.

## Requisitos

- Node.js 20 o superior
- El backend corriendo en `http://localhost:4000`

## Instalación

```bash
cd frontend
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm run dev
```

Abre http://localhost:5173.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 5173 |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | Revisa el código con oxlint |

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `/api` (proxy de Vite hacia `localhost:4000`) |

## Estructura

```
src/
├── main.jsx / App.jsx
├── api/          instancia de axios con JWT + un archivo por módulo
├── context/      AuthContext, CartContext
├── components/
│   ├── layout/   DashboardLayout, Sidebar, Header
│   └── ui/       componentes reutilizables
├── pages/        public, admin, proveedor, dropshipper, transportadora, cliente
├── routes/       rutas protegidas por rol
└── utils/        formatQ, fechas y constantes
```

## Rutas principales

| Ruta | Quién | Contenido |
|---|---|---|
| `/` | Público | Landing con cómo funciona, beneficios y tiendas destacadas |
| `/login`, `/registro` | Público | Acceso (con botones de usuarios demo) y registro con verificación de correo |
| `/tienda/:slug` | Público | Tienda de un dropshipper, detalle de producto, carrito y checkout (este último para clientes) |
| `/politicas/:slug` | Público | Términos, privacidad, cookies y envíos |
| `/admin`, `/proveedor`, `/dropshipper`, `/transportadora`, `/cliente` | Cada rol | Panel con el mismo layout; el menú de cada rol está en `src/routes/panelConfig.jsx` |

## Comportamiento

- El token se guarda en `localStorage` y axios lo agrega en cada petición; ante un 401 la sesión se cierra.
- El carrito se guarda por tienda en `localStorage` y se revisa contra la API al abrir el carrito y el checkout.
- **Modo oscuro:** interruptor sol/luna en el header, guardado en `localStorage` y, la primera vez, según la preferencia del sistema. Se aplica con la clase `dark` en `<html>`.
- El proxy de Vite envía `/api` y `/uploads` al backend (`localhost:4000`).

## Identidad visual

Los colores están definidos como tokens de Tailwind en `src/index.css`:
`primary` (#4F46E5), `primary-hover` (#4338CA), `success` (#10B981), `warning` (#F59E0B), `danger` (#EF4444) y `surface` (#F8FAFC). Tipografía Inter.
