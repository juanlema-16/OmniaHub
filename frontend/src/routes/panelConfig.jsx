import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Megaphone,
  Package,
  PackageSearch,
  Receipt,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Ticket,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import InicioPage from '../pages/shared/InicioPage';
import NotificacionesPage from '../pages/shared/NotificacionesPage';
import PerfilPage from '../pages/shared/PerfilPage';
import KycPage from '../pages/shared/KycPage';
import BilleteraPage from '../pages/shared/BilleteraPage';
import DashboardPage from '../pages/dropshipper/DashboardPage';
import CatalogoPage from '../pages/dropshipper/CatalogoPage';
import ProductoDetallePage from '../pages/dropshipper/ProductoDetallePage';
import PedidosPage from '../pages/dropshipper/PedidosPage';
import NovedadesPage from '../pages/dropshipper/NovedadesPage';
import ProductosImportadosPage from '../pages/dropshipper/ProductosImportadosPage';
import MiTiendaPage from '../pages/dropshipper/MiTiendaPage';
import CuponesPage from '../pages/dropshipper/CuponesPage';
import ClientesPage from '../pages/dropshipper/ClientesPage';
import TransportadorasPage from '../pages/dropshipper/TransportadorasPage';

// Una sola fuente para el menú y las rutas de cada panel.
// Un ítem aparece en el Sidebar en cuanto tiene "element"; los demás son los módulos que
// llegan en los siguientes prompts y se activan al registrar su página aquí.
const inicio = { label: 'Inicio', icon: Home, path: '', element: <InicioPage />, section: 'General' };
const notificaciones = { label: 'Notificaciones', icon: Bell, path: 'notificaciones', element: <NotificacionesPage />, section: 'Cuenta' };
const verificacion = { label: 'Verificación', icon: ShieldCheck, path: 'kyc', element: <KycPage />, section: 'Cuenta' };
const billetera = { label: 'Billetera', icon: Wallet, path: 'billetera', element: <BilleteraPage />, section: 'Finanzas' };
const reportes = { label: 'Reportes', icon: BarChart3, path: 'reportes', section: 'Finanzas' };
const facturas = { label: 'Facturas', icon: Receipt, path: 'facturas', section: 'Finanzas' };

export const PANELES = {
  dropshipper: [
    inicio,
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', element: <DashboardPage />, section: 'General' },
    { label: 'Catálogo', icon: Search, path: 'catalogo', element: <CatalogoPage />, section: 'Ventas' },
    { label: 'Mis pedidos', icon: ShoppingCart, path: 'ordenes', element: <PedidosPage />, section: 'Ventas' },
    { label: 'Novedades', icon: TriangleAlert, path: 'novedades', element: <NovedadesPage />, section: 'Ventas' },
    { label: 'Mis productos', icon: Package, path: 'productos', element: <ProductosImportadosPage />, section: 'Mi tienda' },
    { label: 'Mi tienda', icon: Store, path: 'tienda', element: <MiTiendaPage />, section: 'Mi tienda' },
    { label: 'Cupones', icon: Ticket, path: 'cupones', element: <CuponesPage />, section: 'Mi tienda' },
    { label: 'Clientes', icon: Users, path: 'clientes', element: <ClientesPage />, section: 'Mi tienda' },
    { label: 'Transportadoras', icon: Truck, path: 'transportadoras', element: <TransportadorasPage />, section: 'Mi tienda' },
    billetera,
    reportes,
    facturas,
    verificacion,
    notificaciones,
  ],
  proveedor: [
    inicio,
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', section: 'General' },
    { label: 'Mis productos', icon: Package, path: 'productos', section: 'Catálogo' },
    { label: 'Inventario', icon: Boxes, path: 'inventario', section: 'Catálogo' },
    { label: 'Compras', icon: ShoppingBag, path: 'compras', section: 'Catálogo' },
    { label: 'Órdenes', icon: ClipboardList, path: 'ordenes', section: 'Ventas' },
    { label: 'Caja y POS', icon: Store, path: 'pos', section: 'Ventas' },
    billetera,
    reportes,
    facturas,
    verificacion,
    notificaciones,
  ],
  transportadora: [
    inicio,
    { label: 'Guías', icon: Truck, path: 'guias', section: 'Operación' },
    { label: 'Novedades', icon: TriangleAlert, path: 'novedades', section: 'Operación' },
    billetera,
    reportes,
    notificaciones,
  ],
  admin: [
    inicio,
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', section: 'General' },
    { label: 'Usuarios', icon: Users, path: 'usuarios', section: 'Gestión' },
    { label: 'KYC', icon: ShieldCheck, path: 'kyc', section: 'Gestión' },
    { label: 'Órdenes', icon: ClipboardList, path: 'ordenes', section: 'Gestión' },
    { label: 'Recargas y retiros', icon: Wallet, path: 'solicitudes', section: 'Finanzas' },
    { label: 'Transportadoras', icon: Truck, path: 'transportadoras', section: 'Configuración' },
    { label: 'Publicidad', icon: Megaphone, path: 'banners', section: 'Configuración' },
    { label: 'Políticas', icon: ScrollText, path: 'politicas', section: 'Configuración' },
    { label: 'Configuración', icon: Settings, path: 'configuracion', section: 'Configuración' },
    { label: 'Auditoría', icon: FileText, path: 'auditoria', section: 'Configuración' },
    billetera,
    reportes,
    facturas,
    notificaciones,
  ],
  cliente: [
    inicio,
    { label: 'Mis pedidos', icon: PackageSearch, path: 'pedidos', section: 'Compras' },
    { label: 'Facturas', icon: Receipt, path: 'facturas', section: 'Compras' },
    notificaciones,
  ],
};

// Rutas del panel que no van en el menú (perfil desde el header, detalles desde sus listas)
export const RUTAS_EXTRA = [{ path: 'perfil', element: <PerfilPage /> }];
const RUTAS_OCULTAS = {
  dropshipper: [{ path: 'catalogo/:id', element: <ProductoDetallePage /> }],
};

export const menuDe = (role) => (PANELES[role] || []).filter((item) => item.element);

export const rutasDe = (role) => [...menuDe(role), ...(RUTAS_OCULTAS[role] || []), ...RUTAS_EXTRA];

// ¿Existe ya la página para este enlace? (las notificaciones traen links a módulos futuros)
export const rutaDisponible = (role, link) => {
  if (!link) return false;
  const base = `/${role}`;
  if (!link.startsWith(base)) return false;
  const resto = link.slice(base.length).replace(/^\//, '').split('/')[0];
  return rutasDe(role).some((r) => r.path === resto);
};
