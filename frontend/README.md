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

## Identidad visual

Los colores están definidos como tokens de Tailwind en `src/index.css`:
`primary` (#4F46E5), `primary-hover` (#4338CA), `success` (#10B981), `warning` (#F59E0B), `danger` (#EF4444) y `surface` (#F8FAFC). Tipografía Inter.
