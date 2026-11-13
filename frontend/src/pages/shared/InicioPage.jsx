import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Coins,
  PackageCheck,
  PackageOpen,
  ShieldAlert,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import { getSummary } from '../../api/reports';
import { listOrders } from '../../api/orders';
import { getBanners } from '../../api/public';
import { getMyStores } from '../../api/store';
import TiendaCard from '../../components/store/TiendaCard';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import { OrderStatusBadge } from '../../components/ui/Badge';
import OrderQuickView from '../../components/orders/OrderQuickView';
import { formatQ } from '../../utils/formatQ';
import { formatFecha } from '../../utils/dates';
import { plural } from '../../utils/plural';

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

// Cuatro indicadores clave por rol a partir de /reports/summary (últimos 30 días)
const tarjetasPara = (role, k = {}) =>
  ({
    dropshipper: [
      { label: 'Pedidos generados', value: k.ordenesCreadas, icon: ShoppingCart, tone: 'indigo' },
      { label: 'Pedidos entregados', value: k.ordenesEntregadas, icon: PackageCheck, tone: 'sky' },
      { label: 'Total vendido', value: formatQ(k.ventas), icon: TrendingUp, tone: 'slate' },
      { label: 'Ganancia', value: formatQ(k.ganancia), icon: Coins, tone: 'green' },
    ],
    proveedor: [
      { label: 'Ingresos por dropshipping', value: formatQ(k.ingresosDropshipping), icon: Coins, tone: 'green' },
      { label: 'Unidades vendidas', value: k.unidadesVendidas, icon: PackageCheck, tone: 'indigo' },
      { label: 'Órdenes por preparar', value: k.porPreparar, icon: ClipboardList, tone: 'amber' },
      { label: 'Ventas en caja (POS)', value: formatQ(k.ventasPos), icon: Store, tone: 'sky' },
    ],
    transportadora: [
      { label: 'Guías por recoger', value: k.guiasPorRecoger, icon: PackageOpen, tone: 'amber' },
      { label: 'En tránsito', value: k.enTransito, icon: Truck, tone: 'indigo' },
      { label: 'Entregas', value: k.entregas, icon: CheckCircle2, tone: 'green' },
      { label: 'Ingresos por envío', value: formatQ(k.ingresosEnvio), icon: Banknote, tone: 'sky' },
    ],
    admin: [
      { label: 'Ventas totales', value: formatQ(k.ventasTotales), icon: TrendingUp, tone: 'indigo' },
      { label: 'Comisiones ganadas', value: formatQ(k.comisionesGanadas), icon: Coins, tone: 'green' },
      { label: 'Órdenes entregadas', value: k.ordenesEntregadas, icon: PackageCheck, tone: 'sky' },
      { label: 'KYC por revisar', value: k.kycPendientes, icon: ShieldAlert, tone: 'amber' },
    ],
  })[role] || [];

function Pendientes({ role, k }) {
  if (!k) return null;
  const avisos = [];
  const n = (cantidad, singular, pluralTexto, verboUno, verboVarios) =>
    `${plural(cantidad, singular, pluralTexto)} ${cantidad === 1 ? verboUno : verboVarios}`;
  if (role === 'dropshipper') {
    if (k.pendientesConfirmar) avisos.push(n(k.pendientesConfirmar, 'pedido', 'pedidos', 'espera tu confirmación', 'esperan tu confirmación'));
    if (k.novedadesActivas) avisos.push(`${plural(k.novedadesActivas, 'novedad')} por solucionar`);
  }
  if (role === 'proveedor' && k.productosStockBajo) avisos.push(`${plural(k.productosStockBajo, 'producto')} con stock bajo`);
  if (role === 'transportadora' && k.novedadesActivas) avisos.push(n(k.novedadesActivas, 'novedad', 'novedades', 'activa', 'activas'));
  if (role === 'admin') {
    if (k.recargasPendientes) avisos.push(`${plural(k.recargasPendientes, 'recarga')} por aprobar`);
    if (k.retirosPendientes) avisos.push(`${plural(k.retirosPendientes, 'retiro')} por aprobar`);
  }
  if (!avisos.length) return null;
  return (
    <Alert tone="warning" title="Tienes pendientes" className="mb-6">
      {avisos.join(' · ')}
    </Alert>
  );
}

// Banner a todo el ancho: la imagen cubre el fondo y un degradado índigo mantiene el texto legible
function BannerPanel({ banner, role }) {
  const interno = banner.link?.startsWith(`/${role}`);
  const externo = /^https?:\/\//.test(banner.link || '');
  const contenido = (
    <div className="relative isolate flex min-h-40 items-center overflow-hidden rounded-xl bg-primary shadow-sm">
      <img src={banner.imagen} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-950/85 via-indigo-900/55 to-transparent" aria-hidden="true" />
      <div className="max-w-xl px-6 py-8 text-white sm:px-8">
        <p className="text-xl font-bold tracking-tight sm:text-2xl">{banner.titulo}</p>
        {banner.subtitulo && <p className="mt-1.5 text-sm text-indigo-100">{banner.subtitulo}</p>}
        {(interno || externo) && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/30">
            {role === 'cliente' ? 'Ir a comprar' : 'Ver más'} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
  if (interno) return <Link to={banner.link} className="block transition-opacity hover:opacity-95">{contenido}</Link>;
  if (externo) {
    return (
      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-95">
        {contenido}
      </a>
    );
  }
  return contenido;
}

// Tiendas donde el cliente ya compró, para volver con un clic
function MisTiendas({ tiendas }) {
  const lista = tiendas.data || [];
  return (
    <section aria-labelledby="mis-tiendas">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="mis-tiendas" className="text-lg font-semibold text-slate-900">
          Mis tiendas
        </h2>
        <Link to="/cliente/tiendas" className="text-sm font-medium text-primary hover:underline">
          Explorar más tiendas
        </Link>
      </div>
      {tiendas.cargando && <Skeleton className="h-44 w-full rounded-2xl" />}
      {!tiendas.cargando && !lista.length && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-500">
          Aún no has comprado en ninguna tienda.{' '}
          <Link to="/cliente/tiendas" className="font-medium text-primary hover:underline">
            Explorar tiendas
          </Link>
        </div>
      )}
      {lista.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => (
            <TiendaCard key={t.slug} tienda={t} accion="Seguir comprando" detalle={`${plural(t.pedidos, 'pedido')} · última compra ${formatFecha(t.ultimaCompra)}`} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function InicioPage() {
  const { user } = useAuth();
  const role = user.role;
  const [ordenId, setOrdenId] = useState(null);

  const resumen = useAsync(() => (role === 'cliente' ? Promise.resolve(null) : getSummary()), [role]);
  const ordenes = useAsync(() => listOrders({ limit: 5 }), [role]);
  const banners = useAsync(() => getBanners('PANEL', role), [role]);
  const tiendas = useAsync(() => (role === 'cliente' ? getMyStores() : Promise.resolve(null)), [role]);

  const k = resumen.data?.kpis;
  const porEstado = ordenes.data?.porEstado || {};
  const tarjetas =
    role === 'cliente'
      ? [
          { label: 'Mis pedidos', value: ordenes.data?.total ?? 0, icon: ShoppingCart, tone: 'indigo' },
          { label: 'En camino', value: (porEstado.GUIA_GENERADA || 0) + (porEstado.EN_TRANSITO || 0), icon: Truck, tone: 'sky' },
          { label: 'Entregados', value: porEstado.ENTREGADO || 0, icon: PackageCheck, tone: 'green' },
          { label: 'Por confirmar', value: (porEstado.PENDIENTE_CONFIRMACION || 0) + (porEstado.PENDIENTE || 0), icon: ClipboardList, tone: 'amber' },
        ]
      : tarjetasPara(role, k);

  const columnas = [
    {
      key: 'numero',
      header: 'Orden',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.numero}</p>
          <p className="text-xs text-slate-500">{formatFecha(o.createdAt)}</p>
        </div>
      ),
    },
    { key: 'cliente', header: 'Cliente', render: (o) => `${o.cliente.nombres} ${o.cliente.apellidos}` },
    { key: 'destino', header: 'Destino', render: (o) => `${o.destino.municipio}, ${o.destino.departamento}` },
    { key: 'estado', header: 'Estado', render: (o) => <OrderStatusBadge estado={o.estado} /> },
    { key: 'total', header: 'Total', align: 'right', render: (o) => (o.total !== undefined ? formatQ(o.total) : '—') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {saludo()}, {user.nombre}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === 'cliente' ? 'Aquí tienes el resumen de tus compras.' : 'Este es el resumen de los últimos 30 días.'}
        </p>
      </div>

      {banners.data?.[0] && <BannerPanel banner={banners.data[0]} role={role} />}
      <Pendientes role={role} k={k} />
      {resumen.error && <Alert tone="error">{resumen.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((t) => (
          <StatCard key={t.label} {...t} loading={role === 'cliente' ? ordenes.cargando : resumen.cargando} />
        ))}
      </div>

      {role === 'cliente' && <MisTiendas tiendas={tiendas} />}

      <Card title="Últimas órdenes" description="Haz clic en una orden para ver su seguimiento." padding={false}>
        <Table
          bare
          columns={columnas}
          data={ordenes.data?.items || []}
          loading={ordenes.cargando}
          onRowClick={(o) => setOrdenId(o._id)}
          emptyTitle="Aún no hay órdenes"
          emptyDescription={role === 'cliente' ? 'Cuando compres en una tienda de OmniaHub, tus pedidos aparecerán aquí.' : 'Las órdenes nuevas aparecerán aquí.'}
          skeletonRows={4}
        />
      </Card>

      <OrderQuickView orderId={ordenId} onClose={() => setOrdenId(null)} />
    </div>
  );
}
