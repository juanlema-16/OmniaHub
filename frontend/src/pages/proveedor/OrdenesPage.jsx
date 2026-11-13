import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, ClipboardList, FileText, SlidersHorizontal, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listOrders } from '../../api/orders';
import { getCarriers } from '../../api/shipping';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { OrderStatusBadge } from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import OrderQuickView from '../../components/orders/OrderQuickView';
import GenerarGuiaModal from '../../components/proveedor/GenerarGuiaModal';
import { formatQ } from '../../utils/formatQ';
import { formatFecha, formatFechaHora } from '../../utils/dates';
import { ORDER_STATUS, TIPO_PAGO } from '../../utils/constants';

const EXTRA = { transportadora: '', tipoPago: '', desde: '', hasta: '' };
const ESTADOS_PROVEEDOR = ['PENDIENTE', 'GUIA_GENERADA', 'EN_TRANSITO', 'NOVEDAD', 'ENTREGADO', 'DEVOLUCION', 'CANCELADO'];
const costoDe = (o) => o.items.reduce((s, i) => s + i.precioProveedor * i.cantidad, 0);

export default function OrdenesPage() {
  const [params, setParams] = useSearchParams();
  const pedido = params.get('estado');
  const estado = pedido === 'TODAS' || ESTADOS_PROVEEDOR.includes(pedido) ? pedido : 'PENDIENTE';
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [extra, setExtra] = useState(EXTRA);
  const [verFiltros, setVerFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const [ordenId, setOrdenId] = useState(null);
  const [guiaOrden, setGuiaOrden] = useState(null);

  const carriers = useAsync(getCarriers, []);
  const consulta = {
    estado: estado === 'TODAS' ? undefined : estado,
    search: search || undefined,
    ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)),
    page,
    limit: 10,
  };
  const ordenes = useAsync(() => listOrders(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [estado, search, extra]);

  const porEstado = ordenes.data?.porEstado || {};
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const tabs = [
    ...ESTADOS_PROVEEDOR.map((value) => ({ value, label: value === 'PENDIENTE' ? 'Por preparar' : ORDER_STATUS[value].label, count: porEstado[value] || 0 })),
    { value: 'TODAS', label: 'Todas', count: total },
  ];
  const filtrosActivos = Object.values(extra).filter(Boolean).length;
  const hayFiltros = Boolean(search || filtrosActivos);

  const cambiarEstado = (valor) => setParams(valor === 'PENDIENTE' ? {} : { estado: valor }, { replace: true });
  const cambiarExtra = (e) => setExtra((f) => ({ ...f, [e.target.name]: e.target.value }));
  const recargar = () => ordenes.recargar();

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
      header: 'Productos',
      render: (o) => (
        <div className="flex max-w-48 items-center gap-2.5">
          <img src={o.items[0]?.imagen} alt="" className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-slate-800">{o.items[0]?.nombre}</p>
            <p className="text-xs text-slate-500">
              {o.items.reduce((s, i) => s + i.cantidad, 0)} u.{o.items.length > 1 && ` · ${o.items.length} productos`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (o) => (
        <div className="max-w-44">
          <p className="truncate text-slate-800">
            {o.cliente.nombres} {o.cliente.apellidos}
          </p>
          <p className="truncate text-xs text-slate-500">
            {o.destino.municipio}, {o.destino.departamento}
          </p>
        </div>
      ),
    },
    {
      key: 'transportadora',
      header: 'Transportadora',
      render: (o) => (
        <div>
          <p className="text-slate-800">{o.transportadora?.nombre}</p>
          <p className={`text-xs ${o.guia ? 'font-medium text-primary' : 'text-slate-500'}`}>{o.guia || 'Sin guía'}</p>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (o) => (
        <div className="flex flex-col items-start gap-1">
          <OrderStatusBadge estado={o.estado} />
          <span className="text-xs text-slate-500">{TIPO_PAGO[o.tipoPago]}</span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Tu pago',
      align: 'right',
      render: (o) => <span className="font-semibold text-slate-900">{formatQ(costoDe(o))}</span>,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      sticky: true,
      render: (o) => (
        <div className="flex items-center justify-end gap-2">
          {o.estado === 'PENDIENTE' && (
            <Button
              size="sm"
              icon={FileText}
              onClick={(e) => {
                e.stopPropagation();
                setGuiaOrden(o);
              }}
            >
              Generar guía
            </Button>
          )}
          <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Órdenes por preparar" description="Prepara los pedidos confirmados y genera la guía para la transportadora." />

      <Tabs tabs={tabs} value={estado} onChange={cambiarEstado} />
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
        emptyIcon={ClipboardList}
        emptyTitle={hayFiltros ? 'No hay órdenes con esos filtros' : estado === 'PENDIENTE' ? 'No tienes órdenes por preparar' : 'No hay órdenes en este estado'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : 'Cuando un dropshipper confirme un pedido de tus productos, aparecerá aquí.'}
        aboveTable={
          verFiltros && (
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select label="Transportadora" name="transportadora" value={extra.transportadora} onChange={cambiarExtra} placeholder="Todas" options={(carriers.data || []).map((c) => ({ value: c._id, label: c.nombre }))} />
              <Select label="Tipo de pago" name="tipoPago" value={extra.tipoPago} onChange={cambiarExtra} placeholder="Todos" options={Object.entries(TIPO_PAGO).map(([value, label]) => ({ value, label }))} />
              <Input label="Creada desde" name="desde" type="date" value={extra.desde} max={extra.hasta || undefined} onChange={cambiarExtra} />
              <Input label="Creada hasta" name="hasta" type="date" value={extra.hasta} min={extra.desde || undefined} onChange={cambiarExtra} />
              {filtrosActivos > 0 && (
                <button type="button" onClick={() => setExtra(EXTRA)} className="inline-flex items-center gap-1 text-sm font-medium text-primary sm:col-span-2 lg:col-span-4">
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
        renderAcciones={(orden) =>
          orden.estado === 'PENDIENTE' ? (
            <Button
              icon={FileText}
              onClick={() => {
                setOrdenId(null);
                setGuiaOrden(orden);
              }}
            >
              Generar guía
            </Button>
          ) : null
        }
      />
      <GenerarGuiaModal orden={guiaOrden} onClose={() => setGuiaOrden(null)} onDone={recargar} />
    </div>
  );
}
