import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileSpreadsheet, Package, Trophy } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { getSummary, exportOrders } from '../../api/reports';
import { exportTransactions } from '../../api/wallet';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import DateRange from '../../components/ui/DateRange';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { DOT } from '../../components/ui/Badge';
import { formatQ } from '../../utils/formatQ';
import { diasEntre, formatDiaCorto, haceDiasISO, isoDate } from '../../utils/dates';
import { ORDER_STATUS } from '../../utils/constants';
import { plural } from '../../utils/plural';

// tipo: q (dinero), n (cantidad), p (porcentaje)
const POR_ROL = {
  dropshipper: {
    kpis: [
      { label: 'Total vendido', key: 'ventas', tipo: 'q' },
      { label: 'Ganancia', key: 'ganancia', tipo: 'q' },
      { label: 'Órdenes creadas', key: 'ordenesCreadas', tipo: 'n' },
      { label: 'Órdenes entregadas', key: 'ordenesEntregadas', tipo: 'n' },
      { label: 'Productos vendidos', key: 'productosVendidos', tipo: 'n' },
      { label: 'Ticket promedio', key: 'ticketPromedio', tipo: 'q' },
      { label: 'Tasa de entrega', key: 'tasaEntrega', tipo: 'p' },
    ],
    serie: [
      { key: 'ventas', label: 'Vendido', color: '#4F46E5' },
      { key: 'ganancia', label: 'Ganancia', color: '#10B981' },
    ],
    titulo: 'Ventas y ganancia por día',
  },
  proveedor: {
    kpis: [
      { label: 'Ingresos por dropshipping', key: 'ingresosDropshipping', tipo: 'q' },
      { label: 'Ventas en caja (POS)', key: 'ventasPos', tipo: 'q' },
      { label: 'Ventas en caja', key: 'cantidadVentasPos', tipo: 'n' },
      { label: 'Unidades vendidas', key: 'unidadesVendidas', tipo: 'n' },
      { label: 'Órdenes entregadas', key: 'ordenesEntregadas', tipo: 'n' },
      { label: 'Órdenes por preparar', key: 'porPreparar', tipo: 'n' },
      { label: 'Productos con stock bajo', key: 'productosStockBajo', tipo: 'n' },
      { label: 'Tasa de entrega', key: 'tasaEntrega', tipo: 'p' },
    ],
    serie: [{ key: 'costoProveedor', label: 'Ingresos por dropshipping', color: '#4F46E5' }],
    titulo: 'Ingresos por día',
  },
  transportadora: {
    kpis: [
      { label: 'Ingresos por envíos', key: 'ingresosEnvio', tipo: 'q' },
      { label: 'Recaudado contraentrega', key: 'recaudadoContraentrega', tipo: 'q' },
      { label: 'Entregas', key: 'entregas', tipo: 'n' },
      { label: 'Devoluciones', key: 'devoluciones', tipo: 'n' },
      { label: 'Guías por recoger', key: 'guiasPorRecoger', tipo: 'n' },
      { label: 'En tránsito', key: 'enTransito', tipo: 'n' },
      { label: 'Novedades activas', key: 'novedadesActivas', tipo: 'n' },
      { label: 'Tasa de entrega', key: 'tasaEntrega', tipo: 'p' },
    ],
    serie: [{ key: 'envios', label: 'Ingresos por envíos', color: '#4F46E5' }],
    titulo: 'Ingresos por envíos por día',
  },
  admin: {
    kpis: [
      { label: 'Ventas totales', key: 'ventasTotales', tipo: 'q' },
      { label: 'Comisiones ganadas', key: 'comisionesGanadas', tipo: 'q' },
      { label: 'Órdenes creadas', key: 'ordenesCreadas', tipo: 'n' },
      { label: 'Órdenes entregadas', key: 'ordenesEntregadas', tipo: 'n' },
      { label: 'Ticket promedio', key: 'ticketPromedio', tipo: 'q' },
      { label: 'Tasa de entrega', key: 'tasaEntrega', tipo: 'p' },
    ],
    serie: [
      { key: 'ventas', label: 'Ventas', color: '#4F46E5' },
      { key: 'comision', label: 'Comisión', color: '#10B981' },
    ],
    titulo: 'Ventas y comisiones por día',
  },
};

const formato = { q: formatQ, n: (v) => Number(v ?? 0).toLocaleString('en-US'), p: (v) => `${Number(v ?? 0)}%` };

function TooltipSerie({ active, payload, label, serie }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-900">{formatDiaCorto(label)}</p>
      {serie.map((s) => (
        <p key={s.key} className="text-slate-600">
          {s.label}: <strong className="text-slate-900">{formatQ(d[s.key])}</strong>
        </p>
      ))}
      <p className="text-slate-500">{plural(d.ordenes, 'orden entregada', 'órdenes entregadas')}</p>
    </div>
  );
}

// Reportes compartidos por dropshipper, proveedor, transportadora y admin
export default function ReportesPage() {
  const { user } = useAuth();
  const config = POR_ROL[user.role];
  const [periodo, setPeriodo] = useState({ desde: haceDiasISO(30), hasta: isoDate() });
  const [estado, setEstado] = useState('');
  const [exportando, setExportando] = useState('');
  const { data, cargando, error } = useAsync(() => getSummary(periodo), [periodo.desde, periodo.hasta]);

  const k = data?.kpis || {};
  const porEstado = data?.porEstado || {};
  const totalEstados = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const tops = data?.topProductos || [];

  // Los días sin entregas van en cero para que la gráfica sea continua
  const serie = useMemo(() => {
    const porDia = Object.fromEntries((data?.serie || []).map((d) => [d.fecha, d]));
    const vacio = Object.fromEntries([['ordenes', 0], ...config.serie.map((s) => [s.key, 0])]);
    return diasEntre(periodo.desde, periodo.hasta).map((fecha) => porDia[fecha] || { fecha, ...vacio });
  }, [data, periodo, config]);

  const descargar = async (tipo) => {
    setExportando(tipo);
    try {
      if (tipo === 'ordenes') await exportOrders({ desde: periodo.desde, hasta: periodo.hasta, estado: estado || undefined });
      else await exportTransactions({ desde: periodo.desde, hasta: periodo.hasta });
      toast.success('Descargando el reporte');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportando('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Resultados del período, gráficas y descargas en CSV para Excel." actions={<DateRange value={periodo} onChange={setPeriodo} />} />
      {error && <Alert tone="error">{error}</Alert>}

      <Card title="Resumen del período">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          {config.kpis.map((item) => (
            <div key={item.key}>
              <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
              <dd className="mt-1 text-xl font-bold text-slate-900">{cargando ? <Skeleton className="h-6 w-20" /> : formato[item.tipo](k[item.key])}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        title={config.titulo}
        description="Solo cuentan las órdenes entregadas en el período"
        actions={
          <div className="flex items-center gap-4 text-xs text-slate-600">
            {config.serie.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
              </span>
            ))}
          </div>
        }
      >
        {cargando ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72" role="img" aria-label={config.titulo}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="fecha" tickFormatter={formatDiaCorto} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => `Q${v}`} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<TooltipSerie serie={config.serie} />} cursor={{ fill: 'var(--chart-cursor)' }} />
                {config.serie.map((s) => (
                  <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={20} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Órdenes por estado" description={`${plural(totalEstados, 'orden creada', 'órdenes creadas')} en el período`}>
          {cargando ? (
            <Skeleton className="h-48 w-full" />
          ) : !totalEstados ? (
            <EmptyState icon={Package} title="Sin órdenes en el período" compact />
          ) : (
            <ul className="space-y-3">
              {Object.entries(ORDER_STATUS)
                .filter(([value]) => porEstado[value])
                .map(([value, s]) => (
                  <li key={value}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${DOT[s.tone]}`} aria-hidden="true" /> {s.label}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {porEstado[value]} <span className="font-normal text-slate-500">· {Math.round((porEstado[value] / totalEstados) * 100)}%</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${DOT[s.tone]}`} style={{ width: `${(porEstado[value] / totalEstados) * 100}%` }} />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        {user.role !== 'transportadora' && (
          <Card title="Productos más vendidos" description="Por unidades entregadas">
            {cargando ? (
              <Skeleton className="h-48 w-full" />
            ) : !tops.length ? (
              <EmptyState icon={Trophy} title="Sin ventas en el período" compact />
            ) : (
              <ol className="divide-y divide-slate-100">
                {tops.map((p, i) => (
                  <li key={p.product} className="flex items-center gap-3 py-2.5">
                    <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                    <img src={p.imagen} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.nombre}</p>
                      <p className="text-xs text-slate-500">{plural(p.unidades, 'unidad')}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatQ(p.ingresos)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}
      </div>

      <Card title="Descargas" description="Archivos CSV con el período elegido arriba; se abren directo en Excel.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <FileSpreadsheet className="h-4 w-4 text-primary" aria-hidden="true" /> Órdenes
            </p>
            <p className="mt-1 text-sm text-slate-500">Todas las órdenes creadas en el período, con sus montos según tu rol.</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Select aria-label="Estado de las órdenes" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos los estados" options={Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label }))} className="w-56" />
              <Button variant="secondary" icon={Download} loading={exportando === 'ordenes'} onClick={() => descargar('ordenes')}>
                Descargar
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <FileSpreadsheet className="h-4 w-4 text-primary" aria-hidden="true" /> Movimientos de billetera
            </p>
            <p className="mt-1 text-sm text-slate-500">Entradas y salidas de tu billetera con saldo previo y nuevo.</p>
            <div className="mt-3">
              <Button variant="secondary" icon={Download} loading={exportando === 'movimientos'} onClick={() => descargar('movimientos')}>
                Descargar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
