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
import ReportesPage from '../pages/shared/ReportesPage';
import FacturasPage from '../pages/shared/FacturasPage';
import ClientePedidosPage from '../pages/cliente/PedidosPage';
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
import ProvDashboardPage from '../pages/proveedor/DashboardPage';
import ProvProductosPage from '../pages/proveedor/ProductosPage';
import ProvInventarioPage from '../pages/proveedor/InventarioPage';
import ProvComprasPage from '../pages/proveedor/ComprasPage';
import ProvOrdenesPage from '../pages/proveedor/OrdenesPage';
import ProvPosPage from '../pages/proveedor/PosPage';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminUsuariosPage from '../pages/admin/UsuariosPage';
import AdminKycPage from '../pages/admin/KycPage';
import AdminSolicitudesPage from '../pages/admin/SolicitudesPage';
import AdminOrdenesPage from '../pages/admin/OrdenesPage';
import AdminTransportadorasPage from '../pages/admin/TransportadorasPage';
import AdminConfiguracionPage from '../pages/admin/ConfiguracionPage';
import AdminBannersPage from '../pages/admin/BannersPage';
import AdminPoliticasPage from '../pages/admin/PoliticasPage';
import AdminAuditoriaPage from '../pages/admin/AuditoriaPage';
import TransGuiasPage from '../pages/transportadora/GuiasPage';
import TransNovedadesPage from '../pages/transportadora/NovedadesPage';

// Una sola fuente para el menú y las rutas de cada panel.
// Un ítem aparece en el Sidebar en cuanto tiene "element"; los demás son los módulos que
// llegan en los siguientes prompts y se activan al registrar su página aquí.
const inicio = { label: 'Inicio', icon: Home, path: '', element: <InicioPage />, section: 'General' };
const notificaciones = { label: 'Notificaciones', icon: Bell, path: 'notificaciones', element: <NotificacionesPage />, section: 'Cuenta' };
const verificacion = { label: 'Verificación', icon: ShieldCheck, path: 'kyc', element: <KycPage />, section: 'Cuenta' };
const billetera = { label: 'Billetera', icon: Wallet, path: 'billetera', element: <BilleteraPage />, section: 'Finanzas' };
const reportes = { label: 'Reportes', icon: BarChart3, path: 'reportes', element: <ReportesPage />, section: 'Finanzas' };
const facturas = { label: 'Facturas', icon: Receipt, path: 'facturas', element: <FacturasPage />, section: 'Finanzas' };

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
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', element: <ProvDashboardPage />, section: 'General' },
    { label: 'Mis productos', icon: Package, path: 'productos', element: <ProvProductosPage />, section: 'Catálogo' },
    { label: 'Inventario', icon: Boxes, path: 'inventario', element: <ProvInventarioPage />, section: 'Catálogo' },
    { label: 'Compras', icon: ShoppingBag, path: 'compras', element: <ProvComprasPage />, section: 'Catálogo' },
    { label: 'Órdenes', icon: ClipboardList, path: 'ordenes', element: <ProvOrdenesPage />, section: 'Ventas' },
    { label: 'Caja y POS', icon: Store, path: 'pos', element: <ProvPosPage />, section: 'Ventas' },
    billetera,
    reportes,
    facturas,
    verificacion,
    notificaciones,
  ],
  transportadora: [
    inicio,
    { label: 'Guías', icon: Truck, path: 'guias', element: <TransGuiasPage />, section: 'Operación' },
    { label: 'Novedades', icon: TriangleAlert, path: 'novedades', element: <TransNovedadesPage />, section: 'Operación' },
    billetera,
    reportes,
    notificaciones,
  ],
  admin: [
    inicio,
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', element: <AdminDashboardPage />, section: 'General' },
    { label: 'Usuarios', icon: Users, path: 'usuarios', element: <AdminUsuariosPage />, section: 'Gestión' },
    { label: 'KYC', icon: ShieldCheck, path: 'kyc', element: <AdminKycPage />, section: 'Gestión' },
    { label: 'Órdenes', icon: ClipboardList, path: 'ordenes', element: <AdminOrdenesPage />, section: 'Gestión' },
    { label: 'Recargas y retiros', icon: Wallet, path: 'solicitudes', element: <AdminSolicitudesPage />, section: 'Finanzas' },
    { label: 'Transportadoras', icon: Truck, path: 'transportadoras', element: <AdminTransportadorasPage />, section: 'Configuración' },
    { label: 'Publicidad', icon: Megaphone, path: 'banners', element: <AdminBannersPage />, section: 'Configuración' },
    { label: 'Políticas', icon: ScrollText, path: 'politicas', element: <AdminPoliticasPage />, section: 'Configuración' },
    { label: 'Configuración', icon: Settings, path: 'configuracion', element: <AdminConfiguracionPage />, section: 'Configuración' },
    { label: 'Auditoría', icon: FileText, path: 'auditoria', element: <AdminAuditoriaPage />, section: 'Configuración' },
    billetera,
    reportes,
    facturas,
    notificaciones,
  ],
  cliente: [
    inicio,
    { label: 'Mis pedidos', icon: PackageSearch, path: 'pedidos', element: <ClientePedidosPage />, section: 'Compras' },
    { label: 'Facturas', icon: Receipt, path: 'facturas', element: <FacturasPage />, section: 'Compras' },
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

// Los enlaces de las notificaciones se guardan en genérico ("/billetera", "/dropshipper/ordenes/<id>"):
// aquí se convierten a la ruta real del panel de cada rol
export const resolverLink = (role, link) => {
  if (!link) return link;
  if (link.startsWith('/billetera')) return `/${role}${link.replace('/billetera/retiros', '/billetera?tab=retiros')}`;
  if (link === '/admin/recargas') return '/admin/solicitudes?tab=recargas';
  if (link === '/admin/retiros') return '/admin/solicitudes?tab=retiros';
  const orden = link.match(/^\/(\w+)\/ordenes\/\w+$/);
  if (orden) return orden[1] === 'transportadora' ? '/transportadora/guias' : `/${orden[1]}/ordenes`;
  return link;
};

// ¿Existe ya la página para este enlace?
export const rutaDisponible = (role, link) => {
  if (!link) return false;
  const base = `/${role}`;
  const ruta = resolverLink(role, link).split('?')[0];
  if (!ruta.startsWith(base)) return false;
  const resto = ruta.slice(base.length).replace(/^\//, '').split('/')[0];
  return rutasDe(role).some((r) => r.path === resto);
};
