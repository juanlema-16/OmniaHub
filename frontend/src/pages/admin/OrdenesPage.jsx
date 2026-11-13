import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Download, ShoppingCart, SlidersHorizontal, Wrench, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listOrders } from '../../api/orders';
import { listCarriers } from '../../api/admin';
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
import CorregirEstadoModal, { puedeCorregir } from '../../components/admin/CorregirEstadoModal';
import { formatQ } from '../../utils/formatQ';
import { formatFecha, formatFechaHora } from '../../utils/dates';
import { ORDER_STATUS, TIPO_PAGO } from '../../utils/constants';

const EXTRA = { transportadora: '', tipoPago: '', origen: '', desde: '', hasta: '' };

// Pie del detalle: el admin puede corregir el estado salvo en órdenes ya entregadas
function AccionesAdmin({ orden, onChange }) {
  const [corregir, setCorregir] = useState(false);
  if (!puedeCorregir(orden)) return <p className="text-sm text-slate-500">Orden entregada: el dinero ya se repartió y su estado no se puede cambiar.</p>;
  return (
    <>
      <Button variant="secondary" icon={Wrench} onClick={() => setCorregir(true)}>
        Corregir estado
      </Button>
      {corregir && <CorregirEstadoModal orden={orden} onClose={() => setCorregir(false)} onDone={onChange} />}
    </>
  );
}

export default function OrdenesPage() {
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || '';
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [extra, setExtra] = useState(EXTRA);
  const [verFiltros, setVerFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const [ordenId, setOrdenId] = useState(null);
  const [exportando, setExportando] = useState(false);

  const carriers = useAsync(listCarriers, []);
  const filtros = { estado: estado || undefined, search: search || undefined, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) };
  const consulta = { ...filtros, page, limit: 10 };
  const ordenes = useAsync(() => listOrders(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [estado, search, extra]);

  const porEstado = ordenes.data?.porEstado || {};
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const tabs = [{ value: '', label: 'Todas', count: total }, ...Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label, count: porEstado[value] || 0 }))];
  const filtrosActivos = Object.values(extra).filter(Boolean).length;
  const hayFiltros = Boolean(search || filtrosActivos || estado);

  const cambiarEstado = (valor) => setParams(valor ? { estado: valor } : {}, { replace: true });
  const cambiarExtra = (e) => setExtra((f) => ({ ...f, [e.target.name]: e.target.value }));

  const descargar = async () => {
    setExportando(true);
    try {
      await exportOrders(filtros);
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
            {formatFecha(o.createdAt)} · {o.origen === 'TIENDA' ? 'Tienda' : 'Panel'}
          </p>
        </div>
      ),
    },
    {
      key: 'partes',
      header: 'Dropshipper / proveedor',
      render: (o) => (
        <div className="max-w-52">
          <p className="truncate text-slate-800">{o.dropshipper?.tienda?.nombre || `${o.dropshipper?.nombre ?? ''} ${o.dropshipper?.apellido ?? ''}`}</p>
          <p className="truncate text-xs text-slate-500">{o.proveedor?.empresa?.nombre || 'Proveedor'}</p>
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
          <p className="text-xs text-slate-500">
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
          <p className="text-xs text-success">Comisión {formatQ(o.comision)}</p>
        </div>
      ),
    },
    { key: 'ver', header: '', render: () => <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes"
        description="Todas las órdenes de la plataforma. Puedes corregir el estado de una orden si hubo un error operativo."
        actions={
          <Button variant="secondary" icon={Download} loading={exportando} onClick={descargar}>
            Exportar CSV
          </Button>
        }
      />
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
        emptyIcon={ShoppingCart}
        emptyTitle={hayFiltros ? 'No hay órdenes con esos filtros' : 'Aún no hay órdenes'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : undefined}
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
          <AccionesAdmin
            orden={orden}
            onChange={() => {
              recargar();
              ordenes.recargar();
            }}
          />
        )}
      />
    </div>
  );
}
