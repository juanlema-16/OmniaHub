import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import { getSummary } from '../../api/reports';
import { listOrders } from '../../api/orders';
import { getBanners } from '../../api/public';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import { OrderStatusBadge } from '../../components/ui/Badge';
import OrderQuickView from '../../components/orders/OrderQuickView';
import { formatQ } from '../../utils/formatQ';
import { formatFecha } from '../../utils/dates';

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
  if (role === 'dropshipper') {
    if (k.pendientesConfirmar) avisos.push(`${k.pendientesConfirmar} pedido(s) esperan tu confirmación`);
    if (k.novedadesActivas) avisos.push(`${k.novedadesActivas} novedad(es) por solucionar`);
  }
  if (role === 'proveedor' && k.productosStockBajo) avisos.push(`${k.productosStockBajo} producto(s) con stock bajo`);
  if (role === 'transportadora' && k.novedadesActivas) avisos.push(`${k.novedadesActivas} novedad(es) activas`);
  if (role === 'admin') {
    if (k.recargasPendientes) avisos.push(`${k.recargasPendientes} recarga(s) por aprobar`);
    if (k.retirosPendientes) avisos.push(`${k.retirosPendientes} retiro(s) por aprobar`);
  }
  if (!avisos.length) return null;
  return (
    <Alert tone="warning" title="Tienes pendientes" className="mb-6">
      {avisos.join(' · ')}
    </Alert>
  );
}

function BannerPanel({ banner }) {
  // Texto a la izquierda e imagen en su propio espacio: así la imagen nunca tapa el título
  const contenido = (
    <div className="flex overflow-hidden rounded-xl bg-gradient-to-r from-primary to-indigo-700 shadow-sm">
      <div className="flex-1 px-6 py-7 text-white sm:px-8">
        <p className="text-xl font-bold sm:text-2xl">{banner.titulo}</p>
        {banner.subtitulo && <p className="mt-1 max-w-xl text-sm text-primary-100">{banner.subtitulo}</p>}
      </div>
      <img src={banner.imagen} alt="" className="hidden w-2/5 max-w-sm object-cover md:block" />
    </div>
  );
  if (!banner.link) return contenido;
  return banner.link.startsWith('/') ? (
    <Link to={banner.link} className="block transition-opacity hover:opacity-95">
      {contenido}
    </Link>
  ) : (
    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-95">
      {contenido}
    </a>
  );
}

export default function InicioPage() {
  const { user, wallet } = useAuth();
  const role = user.role;
  const [ordenId, setOrdenId] = useState(null);

  const resumen = useAsync(() => (role === 'cliente' ? Promise.resolve(null) : getSummary()), [role]);
  const ordenes = useAsync(() => listOrders({ limit: 5 }), [role]);
  const banners = useAsync(() => getBanners('PANEL'), []);

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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {saludo()}, {user.nombre}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {role === 'cliente' ? 'Aquí tienes el resumen de tus compras.' : 'Este es el resumen de los últimos 30 días.'}
          </p>
        </div>
        {wallet && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Wallet className="h-4 w-4" aria-hidden="true" /> Saldo disponible <strong className="text-slate-900">{formatQ(wallet.saldoDisponible)}</strong>
          </p>
        )}
      </div>

      {banners.data?.[0] && <BannerPanel banner={banners.data[0]} />}
      <Pendientes role={role} k={k} />
      {resumen.error && <Alert tone="error">{resumen.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((t) => (
          <StatCard key={t.label} {...t} loading={role === 'cliente' ? ordenes.cargando : resumen.cargando} />
        ))}
      </div>

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
