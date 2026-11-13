import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bell, CheckCircle2, Coins, MapPin, Package, PackageCheck, Receipt, ShoppingCart, TrendingUp, TriangleAlert } from 'lucide-react';
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

const COLORES = { ventas: '#4F46E5', ganancia: '#10B981' };

function TooltipVentas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-900">{formatDiaCorto(label)}</p>
      <p className="text-slate-600">
        Vendido: <strong className="text-slate-900">{formatQ(d.ventas)}</strong>
      </p>
      <p className="text-slate-600">
        Ganancia: <strong className="text-success">{formatQ(d.ganancia)}</strong>
      </p>
      <p className="text-slate-500">{plural(d.ordenes, 'orden entregada', 'órdenes entregadas')}</p>
    </div>
  );
}

// Ranking con barra proporcional (top productos y top departamentos)
function ListaTop({ titulo, icon: Icon, items, cargando, vacio, render }) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <Card title={titulo}>
      {cargando && (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      )}
      {!cargando && !items.length && <EmptyState icon={Icon} title="Sin datos en el período" description={vacio} compact />}
      {!cargando && items.length > 0 && (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <li key={item.key}>
              <div className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                {render(item)}
              </div>
              <div className="ml-7 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(item.valor / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState({ desde: haceDiasISO(30), hasta: isoDate() });
  const { data, cargando, error } = useAsync(() => getSummary(periodo), [periodo.desde, periodo.hasta]);
  const k = data?.kpis || {};
  const porEstado = data?.porEstado || {};
  const totalEstados = Object.values(porEstado).reduce((a, b) => a + b, 0);

  // Los días sin entregas van en cero para que la gráfica sea continua
  const serie = useMemo(() => {
    const porDia = Object.fromEntries((data?.serie || []).map((d) => [d.fecha, d]));
    return diasEntre(periodo.desde, periodo.hasta).map((fecha) => porDia[fecha] || { fecha, ventas: 0, ganancia: 0, ordenes: 0 });
  }, [data, periodo]);

  const accesos = [
    { label: 'Por confirmar', valor: k.pendientesConfirmar, icon: Bell, tono: 'bg-amber-50 text-warning', to: '/dropshipper/ordenes?estado=PENDIENTE_CONFIRMACION' },
    { label: 'Novedades por solucionar', valor: k.novedadesActivas, icon: TriangleAlert, tono: 'bg-orange-50 text-orange-600', to: '/dropshipper/novedades' },
    { label: 'Guías en camino', valor: (porEstado.GUIA_GENERADA || 0) + (porEstado.EN_TRANSITO || 0), icon: CheckCircle2, tono: 'bg-primary-50 text-primary', to: '/dropshipper/ordenes?estado=GUIA_GENERADA,EN_TRANSITO' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Rendimiento de tus ventas en el período elegido." actions={<DateRange value={periodo} onChange={setPeriodo} />} />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos generados" value={k.ordenesCreadas ?? 0} icon={ShoppingCart} tone="indigo" loading={cargando} hint={plural(k.productosVendidos ?? 0, 'producto vendido', 'productos vendidos')} />
        <StatCard label="Pedidos entregados" value={k.ordenesEntregadas ?? 0} icon={PackageCheck} tone="sky" loading={cargando} hint={`Tasa de entrega: ${k.tasaEntrega ?? 0}%`} />
        <StatCard label="Total vendido" value={formatQ(k.ventas)} icon={TrendingUp} tone="slate" loading={cargando} hint={`Ticket promedio: ${formatQ(k.ticketPromedio)}`} />
        <StatCard label="Ganancia" value={formatQ(k.ganancia)} icon={Coins} tone="green" loading={cargando} hint="Después de proveedor, envío y comisión" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {accesos.map((t) => (
          <Link key={t.label} to={t.to} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40">
            <div>
              {cargando ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-bold text-slate-900">{t.valor ?? 0}</p>}
              <p className="text-sm text-slate-500">{t.label}</p>
            </div>
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.tono}`}>
              <t.icon className="h-5 w-5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <Card
        title="Rendimiento"
        description="Ventas y ganancia de las órdenes entregadas, por día"
        actions={
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORES.ventas }} /> Vendido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORES.ganancia }} /> Ganancia
            </span>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50 py-3 text-center">
          <div>
            <p className="text-lg font-bold text-slate-900">{formatQ(k.ventas)}</p>
            <p className="text-xs text-slate-500">Vendido</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{k.ordenesEntregadas ?? 0}</p>
            <p className="text-xs text-slate-500">Órdenes entregadas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{k.tasaEntrega ?? 0}%</p>
            <p className="text-xs text-slate-500">Operación completada</p>
          </div>
        </div>
        {cargando ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72" role="img" aria-label="Gráfica de ventas y ganancia por día">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {Object.entries(COLORES).map(([key, color]) => (
                    <linearGradient key={key} id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="fecha" tickFormatter={formatDiaCorto} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => `Q${v}`} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<TooltipVentas />} />
                <Area type="monotone" dataKey="ventas" stroke={COLORES.ventas} strokeWidth={2} fill="url(#g-ventas)" />
                <Area type="monotone" dataKey="ganancia" stroke={COLORES.ganancia} strokeWidth={2} fill="url(#g-ganancia)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <ListaTop
          titulo="Top productos"
          icon={Package}
          cargando={cargando}
          vacio="Aquí aparecerán tus productos más vendidos."
          items={(data?.topProductos || []).map((p) => ({ ...p, key: p.product, valor: p.unidades }))}
          render={(p) => (
            <>
              <img src={p.imagen} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{p.nombre}</p>
                <p className="text-xs text-slate-500">
                  {plural(p.unidades, 'unidad')} · {formatQ(p.ingresos)}
                </p>
              </div>
            </>
          )}
        />
        <ListaTop
          titulo="Top departamentos"
          icon={MapPin}
          cargando={cargando}
          vacio="Aquí verás a dónde envías más pedidos."
          items={(data?.topDepartamentos || []).map((d) => ({ ...d, key: d.departamento, valor: d.ordenes }))}
          render={(d) => (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{d.departamento}</p>
                <p className="text-xs text-slate-500">
                  {plural(d.ordenes, 'entrega')} · {formatQ(d.ventas)}
                </p>
              </div>
            </>
          )}
        />
        <Card title="Órdenes por estado" description={`${plural(totalEstados, 'orden creada', 'órdenes creadas')} en el período`}>
          {cargando && <Skeleton className="h-48 w-full" />}
          {!cargando && totalEstados === 0 && <EmptyState icon={Receipt} title="Sin órdenes en el período" compact />}
          {!cargando && totalEstados > 0 && (
            <ul className="space-y-2.5">
              {Object.entries(ORDER_STATUS).map(([estado, cfg]) => (
                <li key={estado} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={`h-2 w-2 rounded-full ${DOT[cfg.tone]}`} aria-hidden="true" />
                    {cfg.label}
                  </span>
                  <span className="font-semibold text-slate-900">{porEstado[estado] || 0}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
