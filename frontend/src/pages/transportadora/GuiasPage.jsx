import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listOrders } from '../../api/orders';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge, { OrderStatusBadge } from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import OrderQuickView from '../../components/orders/OrderQuickView';
import AccionesGuia from '../../components/transportadora/AccionesGuia';
import { cobraEfectivo } from '../../components/transportadora/acciones';
import { formatQ } from '../../utils/formatQ';
import { formatFecha } from '../../utils/dates';
import { ORDER_STATUS, TIPO_PAGO } from '../../utils/constants';

const ESTADOS = ['GUIA_GENERADA', 'EN_TRANSITO', 'NOVEDAD', 'ENTREGADO', 'DEVOLUCION'];
const EXTRA = { tipoPago: '', desde: '', hasta: '' };

// Según el estado: por cobrar mientras va en camino, cobrado al entregarse, no cobrado si se devolvió o canceló
const ESTADO_COBRO = {
  ENTREGADO: { texto: 'Cobrado', clase: 'text-emerald-700' },
  DEVOLUCION: { texto: 'No cobrado', clase: 'text-slate-500' },
  CANCELADO: { texto: 'No cobrado', clase: 'text-slate-500' },
};

const Cobro = ({ orden }) => {
  if (!cobraEfectivo(orden)) {
    return (
      <div>
        <p className="font-medium text-slate-500">Sin cobro</p>
        <p className="text-xs text-slate-500">{orden.tipoPago === 'SIN_RECAUDO' ? 'Prepagada' : 'Pagada con tarjeta'}</p>
      </div>
    );
  }
  const cobro = ESTADO_COBRO[orden.estado] || { texto: 'Cobrar en efectivo', clase: 'text-amber-700' };
  const monto = orden.estado === 'ENTREGADO' ? orden.montoRecaudado ?? orden.total : orden.total;
  return (
    <div>
      <p className={`font-semibold ${ESTADO_COBRO[orden.estado] && orden.estado !== 'ENTREGADO' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{formatQ(monto)}</p>
      <p className={`text-xs ${cobro.clase}`}>{cobro.texto}</p>
    </div>
  );
};

export default function GuiasPage() {
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || '';
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [extra, setExtra] = useState(EXTRA);
  const [verFiltros, setVerFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const [ordenId, setOrdenId] = useState(null);

  const consulta = {
    estado: estado || undefined,
    search: search || undefined,
    ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)),
    page,
    limit: 10,
  };
  const guias = useAsync(() => listOrders(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [estado, search, extra]);

  const porEstado = guias.data?.porEstado || {};
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const tabs = [{ value: '', label: 'Todas', count: total }, ...ESTADOS.map((value) => ({ value, label: ORDER_STATUS[value].label, count: porEstado[value] || 0 }))];
  const filtrosActivos = Object.values(extra).filter(Boolean).length;
  const hayFiltros = Boolean(search || filtrosActivos || estado);

  const cambiarEstado = (valor) => setParams(valor ? { estado: valor } : {}, { replace: true });
  const cambiarExtra = (e) => setExtra((f) => ({ ...f, [e.target.name]: e.target.value }));

  const columnas = [
    {
      key: 'guia',
      header: 'Guía',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.guia || 'Sin guía'}</p>
          <p className="text-xs text-slate-500">{o.numero}</p>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Destinatario',
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
        <div className="max-w-56">
          <p className="text-slate-800">
            {o.destino.municipio}, {o.destino.departamento}
          </p>
          <p className="truncate text-xs text-slate-500">{o.destino.direccion}</p>
        </div>
      ),
    },
    { key: 'cobro', header: 'Cobro', render: (o) => <Cobro orden={o} /> },
    { key: 'pago', header: 'Pago', render: (o) => <Badge tone={o.tipoPago === 'CON_RECAUDO' ? 'sky' : 'violet'}>{TIPO_PAGO[o.tipoPago]}</Badge> },
    {
      key: 'estado',
      header: 'Estado',
      render: (o) => (
        <div className="space-y-1">
          <OrderStatusBadge estado={o.estado} />
          {o.novedad?.solucion && o.estado === 'EN_TRANSITO' && (
            <p className="max-w-48 truncate text-xs text-orange-700" title={o.novedad.solucion}>
              Solución: {o.novedad.solucion}
            </p>
          )}
        </div>
      ),
    },
    { key: 'fecha', header: 'Creada', render: (o) => <span className="text-slate-600">{formatFecha(o.createdAt)}</span> },
    { key: 'ver', header: '', render: () => <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Mis guías" description="Guías asignadas a tu transportadora: recógelas, entrégalas o reporta novedades." />

      <Tabs tabs={tabs} value={estado} onChange={cambiarEstado} />
      {guias.error && <Alert tone="error">{guias.error}</Alert>}

      <Table
        columns={columnas}
        data={guias.data?.items || []}
        loading={guias.cargando}
        onRowClick={(o) => setOrdenId(o._id)}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por orden, guía, teléfono o cliente' }}
        filters={
          <Button variant={filtrosActivos ? 'soft' : 'secondary'} size="sm" icon={SlidersHorizontal} onClick={() => setVerFiltros((v) => !v)} aria-expanded={verFiltros}>
            Filtros{filtrosActivos ? ` (${filtrosActivos})` : ''}
          </Button>
        }
        pagination={guias.data && { page: guias.data.page, pages: guias.data.pages, total: guias.data.total, onPageChange: setPage }}
        emptyIcon={PackageSearch}
        emptyTitle={hayFiltros ? 'No hay guías con esos filtros' : 'Aún no tienes guías asignadas'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : 'Cuando un proveedor genere una guía con tu transportadora aparecerá aquí.'}
        aboveTable={
          verFiltros && (
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3">
              <Select label="Tipo de pago" name="tipoPago" value={extra.tipoPago} onChange={cambiarExtra} placeholder="Todos" options={Object.entries(TIPO_PAGO).map(([value, label]) => ({ value, label }))} />
              <Input label="Creada desde" name="desde" type="date" value={extra.desde} max={extra.hasta || undefined} onChange={cambiarExtra} />
              <Input label="Creada hasta" name="hasta" type="date" value={extra.hasta} min={extra.desde || undefined} onChange={cambiarExtra} />
              {filtrosActivos > 0 && (
                <button type="button" onClick={() => setExtra(EXTRA)} className="inline-flex items-center gap-1 text-sm font-medium text-primary sm:col-span-3">
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
          <AccionesGuia
            orden={orden}
            onChange={() => {
              recargar();
              guias.recargar();
            }}
          />
        )}
      />
    </div>
  );
}
