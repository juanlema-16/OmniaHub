import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Boxes, ClipboardList, Package, PackageCheck, Store, TrendingUp, TriangleAlert } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getSummary } from '../../api/reports';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import DateRange from '../../components/ui/DateRange';
import { DOT } from '../../components/ui/Badge';
import { formatQ } from '../../utils/formatQ';
import { diasEntre, formatDiaCorto, haceDiasISO, isoDate } from '../../utils/dates';
import { ORDER_STATUS } from '../../utils/constants';
import { plural } from '../../utils/plural';

const COLOR = '#4F46E5';

function TooltipVentas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-900">{formatDiaCorto(label)}</p>
      <p className="text-slate-600">
        Ventas: <strong className="text-slate-900">{formatQ(d.costoProveedor)}</strong>
      </p>
      <p className="text-slate-500">{plural(d.ordenes, 'orden entregada', 'órdenes entregadas')}</p>
    </div>
  );
}

function Acceso({ to, icon: Icon, tono, valor, label, cargando }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tono}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          {cargando ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold text-slate-900">{valor ?? 0}</p>}
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
    </Link>
  );
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState({ desde: haceDiasISO(30), hasta: isoDate() });
  const { data, cargando, error } = useAsync(() => getSummary(periodo), [periodo.desde, periodo.hasta]);
  const k = data?.kpis || {};
  const porEstado = data?.porEstado || {};
  const totalEstados = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const top = data?.topProductos || [];
  const maxTop = Math.max(1, ...top.map((p) => p.unidades));

  const serie = useMemo(() => {
    const porDia = Object.fromEntries((data?.serie || []).map((d) => [d.fecha, d]));
    return diasEntre(periodo.desde, periodo.hasta).map((fecha) => porDia[fecha] || { fecha, costoProveedor: 0, ordenes: 0 });
  }, [data, periodo]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Resumen de tus ventas, órdenes e inventario." actions={<DateRange value={periodo} onChange={setPeriodo} />} />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas por dropshipping" value={formatQ(k.ingresosDropshipping)} icon={TrendingUp} tone="indigo" loading={cargando} hint={`${plural(k.ordenesEntregadas ?? 0, 'orden entregada', 'órdenes entregadas')}`} />
        <StatCard label="Ventas en caja (POS)" value={formatQ(k.ventasPos)} icon={Store} tone="green" loading={cargando} hint={plural(k.cantidadVentasPos ?? 0, 'venta')} />
        <StatCard label="Unidades vendidas" value={k.unidadesVendidas ?? 0} icon={PackageCheck} tone="sky" loading={cargando} hint={`Tasa de entrega: ${k.tasaEntrega ?? 0}%`} />
        <StatCard label="Órdenes del período" value={totalEstados} icon={ClipboardList} tone="slate" loading={cargando} hint="Creadas en las fechas elegidas" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Acceso to="/proveedor/ordenes?estado=PENDIENTE" icon={ClipboardList} tono="bg-amber-50 text-warning" valor={k.porPreparar} label="Órdenes por preparar" cargando={cargando} />
        <Acceso to="/proveedor/inventario?tab=stock-bajo" icon={TriangleAlert} tono="bg-red-50 text-danger" valor={k.productosStockBajo} label="Productos con stock bajo" cargando={cargando} />
        <Acceso to="/proveedor/pos" icon={Store} tono="bg-primary-50 text-primary" valor={k.cantidadVentasPos} label="Ventas POS en el período" cargando={cargando} />
      </div>

      <Card title="Ventas por día" description="Lo que cobras por las órdenes entregadas (precio proveedor)">
        {cargando ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72" role="img" aria-label="Gráfica de ventas por día">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-prov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="fecha" tickFormatter={formatDiaCorto} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => `Q${v}`} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<TooltipVentas />} />
                <Area type="monotone" dataKey="costoProveedor" stroke={COLOR} strokeWidth={2} fill="url(#g-prov)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Productos más vendidos" className="lg:col-span-2">
          {cargando && (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          )}
          {!cargando && !top.length && <EmptyState icon={Package} title="Sin ventas en el período" description="Aquí aparecerán tus productos más vendidos." compact />}
          {!cargando && top.length > 0 && (
            <ol className="space-y-4">
              {top.map((p, i) => (
                <li key={p.product}>
                  <div className="flex items-center gap-3">
                    <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                    <img src={p.imagen} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {plural(p.unidades, 'unidad')} · {formatQ(p.ingresos)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-7 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(p.unidades / maxTop) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Órdenes por estado" actions={<Link to="/proveedor/ordenes" className="text-sm font-medium text-primary hover:underline">Ver todas</Link>}>
          {cargando && <Skeleton className="h-40 w-full" />}
          {!cargando && totalEstados === 0 && <EmptyState icon={Boxes} title="Sin órdenes" description="Aún no hay órdenes en este período." compact />}
          {!cargando && totalEstados > 0 && (
            <ul className="space-y-3">
              {Object.entries(ORDER_STATUS)
                .filter(([estado]) => porEstado[estado])
                .map(([estado, s]) => (
                  <li key={estado} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2 w-2 rounded-full ${DOT[s.tone]}`} aria-hidden="true" />
                      {s.label}
                    </span>
                    <strong className="text-slate-900">{porEstado[estado]}</strong>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
