import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Download, Plus, SlidersHorizontal, ShoppingCart, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listOrders } from '../../api/orders';
import { getCarriers } from '../../api/shipping';
import { exportOrders } from '../../api/reports';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge, { OrderStatusBadge } from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import OrderQuickView from '../../components/orders/OrderQuickView';
import CrearOrdenModal from '../../components/orders/CrearOrdenModal';
import OrdenAcciones from '../../components/dropshipper/OrdenAcciones';
import { formatQ } from '../../utils/formatQ';
import { formatFecha, formatFechaHora } from '../../utils/dates';
import { ORDER_STATUS, TIPO_PAGO } from '../../utils/constants';

const EXTRA = { transportadora: '', tipoPago: '', origen: '', desde: '', hasta: '' };

export default function PedidosPage() {
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || '';
  const [texto, setTexto] = useState(() => params.get('buscar') || '');
  const search = useDebounce(texto, 350);
  const [extra, setExtra] = useState(EXTRA);
  const [verFiltros, setVerFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const [ordenId, setOrdenId] = useState(null);
  const [crear, setCrear] = useState(false);
  const [exportando, setExportando] = useState(false);

  const carriers = useAsync(getCarriers, []);
  const consulta = {
    estado: estado || undefined,
    search: search || undefined,
    ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)),
    page,
    limit: 10,
  };
  const ordenes = useAsync(() => listOrders(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [estado, search, extra]);

  const porEstado = ordenes.data?.porEstado || {};
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const tabs = [{ value: '', label: 'Todas', count: total }, ...Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label, count: porEstado[value] || 0 }))];
  const filtrosActivos = Object.values(extra).filter(Boolean).length;

  const cambiarEstado = (valor) => setParams(valor ? { estado: valor } : {}, { replace: true });
  const cambiarExtra = (e) => setExtra((f) => ({ ...f, [e.target.name]: e.target.value }));

  const descargar = async () => {
    setExportando(true);
    try {
      await exportOrders({ desde: extra.desde || undefined, hasta: extra.hasta || undefined, estado: estado && !estado.includes(',') ? estado : undefined });
      toast.success('Descargando el reporte de órdenes');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportando(false);
    }
  };

  const columnas = [
    {
      key: 'numero',
      header: 'Orden',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.numero}</p>
          <p className="text-xs text-slate-500" title={formatFechaHora(o.createdAt)}>
            {formatFecha(o.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'producto',
      header: 'Producto',
      render: (o) => (
        <div className="flex max-w-56 items-center gap-2.5">
          <img src={o.items[0]?.imagen} alt="" className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-slate-800">{o.items[0]?.nombre}</p>
            <p className="text-xs text-slate-500">
              {o.items.reduce((s, i) => s + i.cantidad, 0)} u.{o.items.length > 1 && ` · +${o.items.length - 1} producto${o.items.length > 2 ? 's' : ''}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (o) => (
        <div>
          <p className="text-slate-800">
            {o.cliente.nombres} {o.cliente.apellidos}
          </p>
          <p className="text-xs text-slate-500">{o.cliente.telefono}</p>
        </div>
      ),
    },
    {
      key: 'destino',
      header: 'Destino',
      render: (o) => (
        <div>
          <p className="text-slate-800">{o.destino.municipio}</p>
          <p className="text-xs text-slate-500">{o.destino.departamento}</p>
        </div>
      ),
    },
    {
      key: 'transportadora',
      header: 'Transportadora',
      render: (o) => (
        <div>
          <p className="text-slate-800">{o.transportadora?.nombre}</p>
          <p className="text-xs text-slate-500">{o.guia || 'Sin guía'}</p>
        </div>
      ),
    },
    { key: 'tipoPago', header: 'Pago', render: (o) => <Badge tone={o.tipoPago === 'CON_RECAUDO' ? 'sky' : 'violet'}>{TIPO_PAGO[o.tipoPago]}</Badge> },
    { key: 'estado', header: 'Estado', render: (o) => <OrderStatusBadge estado={o.estado} /> },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{formatQ(o.total)}</p>
          <p className={`text-xs ${o.gananciaDropshipper < 0 ? 'text-danger' : 'text-success'}`}>Ganancia {formatQ(o.gananciaDropshipper)}</p>
        </div>
      ),
    },
    { key: 'ver', header: '', render: () => <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis pedidos"
        description="Confirma, cancela y sigue cada orden hasta la entrega."
        actions={
          <>
            <Button variant="secondary" icon={Download} loading={exportando} onClick={descargar}>
              Exportar CSV
            </Button>
            <Button icon={Plus} onClick={() => setCrear(true)}>
              Crear orden
            </Button>
          </>
        }
      />

      <Tabs tabs={tabs} value={estado} onChange={cambiarEstado} />
      {estado.includes(',') && (
        <Alert tone="info" action={<Button size="sm" variant="secondary" onClick={() => cambiarEstado('')}>Ver todas</Button>}>
          Mostrando: {estado.split(',').map((e) => ORDER_STATUS[e]?.label).join(' y ')}
        </Alert>
      )}
      {ordenes.error && <Alert tone="error">{ordenes.error}</Alert>}

      <Table
        columns={columnas}
        data={ordenes.data?.items || []}
        loading={ordenes.cargando}
        onRowClick={(o) => setOrdenId(o._id)}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por orden, guía, teléfono o cliente' }}
        filters={
          <Button variant={filtrosActivos ? 'soft' : 'secondary'} size="sm" icon={SlidersHorizontal} onClick={() => setVerFiltros((v) => !v)} aria-expanded={verFiltros}>
            Filtros{filtrosActivos ? ` (${filtrosActivos})` : ''}
          </Button>
        }
        pagination={ordenes.data && { page: ordenes.data.page, pages: ordenes.data.pages, total: ordenes.data.total, onPageChange: setPage }}
        emptyIcon={ShoppingCart}
        emptyTitle={search || filtrosActivos || estado ? 'No hay pedidos con esos filtros' : 'Aún no tienes pedidos'}
        emptyDescription={search || filtrosActivos || estado ? 'Prueba con otra búsqueda o quita los filtros.' : 'Crea tu primera orden desde el catálogo o con el botón Crear orden.'}
        aboveTable={
          verFiltros && (
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <Select label="Transportadora" name="transportadora" value={extra.transportadora} onChange={cambiarExtra} placeholder="Todas" options={(carriers.data || []).map((c) => ({ value: c._id, label: c.nombre }))} />
              <Select label="Tipo de pago" name="tipoPago" value={extra.tipoPago} onChange={cambiarExtra} placeholder="Todos" options={Object.entries(TIPO_PAGO).map(([value, label]) => ({ value, label }))} />
              <Select label="Origen" name="origen" value={extra.origen} onChange={cambiarExtra} placeholder="Todos" options={[{ value: 'PANEL', label: 'Creada en el panel' }, { value: 'TIENDA', label: 'Tienda en línea' }]} />
              <Input label="Creada desde" name="desde" type="date" value={extra.desde} max={extra.hasta || undefined} onChange={cambiarExtra} />
              <Input label="Creada hasta" name="hasta" type="date" value={extra.hasta} min={extra.desde || undefined} onChange={cambiarExtra} />
              {filtrosActivos > 0 && (
                <button type="button" onClick={() => setExtra(EXTRA)} className="inline-flex items-center gap-1 text-sm font-medium text-primary sm:col-span-2 lg:col-span-5">
                  <X className="h-4 w-4" aria-hidden="true" /> Quitar filtros
                </button>
              )}
            </div>
          )
        }
      />

      <OrderQuickView
        orderId={ordenId}
        onClose={() => setOrdenId(null)}
        renderAcciones={(orden, { recargar }) => (
          <OrdenAcciones
            orden={orden}
            onChange={() => {
              recargar();
              ordenes.recargar();
            }}
          />
        )}
      />
      <CrearOrdenModal open={crear} onClose={() => setCrear(false)} onCreated={() => (estado ? cambiarEstado('') : ordenes.recargar())} />
    </div>
  );
}
