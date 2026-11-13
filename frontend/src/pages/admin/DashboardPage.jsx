import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, Coins, HandCoins, Package, PackageCheck, Receipt, ShieldCheck, Store, TrendingUp } from 'lucide-react';
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
import ListaRanking from '../../components/admin/ListaRanking';
import { formatQ } from '../../utils/formatQ';
import { diasEntre, formatDiaCorto, haceDiasISO, isoDate } from '../../utils/dates';
import { ORDER_STATUS, ROLES } from '../../utils/constants';
import { plural } from '../../utils/plural';

const COLORES = { ventas: '#4F46E5', comision: '#10B981' };

function TooltipVentas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-900">{formatDiaCorto(label)}</p>
      <p className="text-slate-600">
        Ventas: <strong className="text-slate-900">{formatQ(d.ventas)}</strong>
      </p>
      <p className="text-slate-600">
        Comisiones: <strong className="text-success">{formatQ(d.comision)}</strong>
      </p>
      <p className="text-slate-500">{plural(d.ordenes, 'orden entregada', 'órdenes entregadas')}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState({ desde: haceDiasISO(30), hasta: isoDate() });
  const { data, cargando, error } = useAsync(() => getSummary(periodo), [periodo.desde, periodo.hasta]);
  const k = data?.kpis || {};
  const porEstado = data?.porEstado || {};
  const usuarios = data?.usuariosPorRol || {};
  const totalEstados = Object.values(porEstado).reduce((a, b) => a + b, 0);

  const serie = useMemo(() => {
    const porDia = Object.fromEntries((data?.serie || []).map((d) => [d.fecha, d]));
    return diasEntre(periodo.desde, periodo.hasta).map((fecha) => porDia[fecha] || { fecha, ventas: 0, comision: 0, ordenes: 0 });
  }, [data, periodo]);

  const pendientes = [
    { label: 'Verificaciones KYC', valor: k.kycPendientes, icon: ShieldCheck, tono: 'bg-amber-50 text-warning', to: '/admin/kyc' },
    { label: 'Recargas por aprobar', valor: k.recargasPendientes, icon: Banknote, tono: 'bg-sky-50 text-sky-600', to: '/admin/solicitudes?tab=recargas' },
    { label: 'Retiros por aprobar', valor: k.retirosPendientes, icon: HandCoins, tono: 'bg-primary-50 text-primary', to: '/admin/solicitudes?tab=retiros' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Panorama global de OmniaHub en el período elegido." actions={<DateRange value={periodo} onChange={setPeriodo} />} />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas totales" value={formatQ(k.ventasTotales)} icon={TrendingUp} tone="indigo" loading={cargando} hint={`Ticket promedio: ${formatQ(k.ticketPromedio)}`} />
        <StatCard label="Comisiones ganadas" value={formatQ(k.comisionesGanadas)} icon={Coins} tone="green" loading={cargando} hint="Lo que recibe la plataforma" />
        <StatCard label="Órdenes entregadas" value={k.ordenesEntregadas ?? 0} icon={PackageCheck} tone="sky" loading={cargando} hint={`Tasa de entrega: ${k.tasaEntrega ?? 0}%`} />
        <StatCard label="Órdenes creadas" value={k.ordenesCreadas ?? 0} icon={Receipt} tone="slate" loading={cargando} hint="Todas las que se crearon en el período" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {pendientes.map((t) => (
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
        title="Ventas y comisiones"
        description="De las órdenes entregadas, por día"
        actions={
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORES.ventas }} /> Ventas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORES.comision }} /> Comisiones
            </span>
          </div>
        }
      >
        {cargando ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72" role="img" aria-label="Gráfica de ventas y comisiones por día">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {Object.entries(COLORES).map(([key, color]) => (
                    <linearGradient key={key} id={`g-admin-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="fecha" tickFormatter={formatDiaCorto} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => `Q${v}`} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<TooltipVentas />} />
                <Area type="monotone" dataKey="ventas" stroke={COLORES.ventas} strokeWidth={2} fill="url(#g-admin-ventas)" />
                <Area type="monotone" dataKey="comision" stroke={COLORES.comision} strokeWidth={2} fill="url(#g-admin-comision)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <ListaRanking
          titulo="Top productos"
          icon={Package}
          cargando={cargando}
          vacio="Aquí aparecerán los productos más vendidos."
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
        <ListaRanking
          titulo="Top dropshippers"
          icon={Store}
          cargando={cargando}
          vacio="Aquí verás las tiendas que más venden."
          items={(data?.topDropshippers || []).map((d) => ({ ...d, key: d.dropshipper, valor: d.ventas }))}
          render={(d) => (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <Store className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{d.tienda || d.nombre}</p>
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
        <Card title="Usuarios por rol" description="Cuentas registradas en la plataforma">
          {cargando ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ul className="space-y-2.5">
              {Object.entries(ROLES).map(([rol, cfg]) => (
                <li key={rol} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">{cfg.label}</span>
                  <span className="font-semibold text-slate-900">{usuarios[rol] || 0}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
