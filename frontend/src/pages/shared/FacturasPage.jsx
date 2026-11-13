import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronRight, Download, Receipt, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { exportInvoices, listInvoices } from '../../api/invoices';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import FacturaModal from '../../components/invoices/FacturaModal';
import { formatFecha } from '../../utils/dates';
import { formatQ } from '../../utils/formatQ';

const FILTROS = { desde: '', hasta: '', origen: '' };

// Cada rol factura algo distinto: el proveedor solo sus ventas del POS (las ventas en línea las factura el
// dropshipper al entregarse la orden), el cliente recibe las de sus compras y el admin ve todas
const TEXTOS = {
  proveedor: {
    descripcion: 'Las facturas de tus ventas en caja (POS). Las ventas en línea las factura el dropshipper al entregarse cada orden.',
    vacio: 'Se generan solas cada vez que cobras una venta en el punto de venta.',
  },
  dropshipper: { descripcion: 'Las facturas que emites a tus clientes cuando se entrega cada orden.', vacio: 'Se generan solas cuando una orden se entrega.' },
  cliente: { descripcion: 'Las facturas de tus compras.', vacio: 'Recibirás la factura cuando se entregue tu pedido.' },
  admin: { descripcion: 'Todas las facturas de la plataforma: órdenes entregadas y ventas en caja.', vacio: 'Se generan solas cuando una orden se entrega o se cobra una venta en el punto de venta.' },
};

// Facturas emitidas (dropshipper, proveedor), recibidas (cliente) o todas (admin)
export default function FacturasPage() {
  const { user } = useAuth();
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [filtros, setFiltros] = useState(FILTROS);
  const [page, setPage] = useState(1);
  const [abierta, setAbierta] = useState(null);
  const [exportando, setExportando] = useState(false);

  const filtrosApi = { ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)), search: search || undefined };
  const facturas = useAsync(() => listInvoices({ ...filtrosApi, page, limit: 10 }), [JSON.stringify(filtrosApi), page]);
  const hayFiltros = Object.values(filtros).some(Boolean) || Boolean(search);
  const fechasInvalidas = filtros.desde && filtros.hasta && filtros.desde > filtros.hasta;

  useEffect(() => setPage(1), [filtros, search]);

  const cambiar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));

  const descargar = async () => {
    setExportando(true);
    try {
      await exportInvoices(filtrosApi);
      toast.success('Descargando tus facturas');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportando(false);
    }
  };

  const columnas = [
    { key: 'numero', header: 'Factura', render: (f) => <span className="font-semibold text-slate-900">{f.numero}</span> },
    { key: 'fecha', header: 'Fecha', render: (f) => <span className="whitespace-nowrap text-slate-600">{formatFecha(f.fecha)}</span> },
    {
      key: 'origen',
      header: 'Origen',
      render: (f) => (
        <div>
          <Badge tone={f.order ? 'indigo' : 'violet'}>{f.order ? 'Orden' : 'Punto de venta'}</Badge>
          {f.order && <p className="mt-0.5 text-xs text-slate-500">{f.order.numero}</p>}
        </div>
      ),
    },
    ...(user.role === 'admin' || user.role === 'cliente'
      ? [{ key: 'emisor', header: 'Emisor', render: (f) => <span className="text-slate-800">{f.emisor.nombre}</span> }]
      : []),
    ...(user.role !== 'cliente'
      ? [
          {
            key: 'receptor',
            header: 'Receptor',
            render: (f) => (
              <div>
                <p className="text-slate-800">{f.receptor.nombre}</p>
                <p className="text-xs text-slate-500">NIT: {f.receptor.nit || 'CF'}</p>
              </div>
            ),
          },
        ]
      : []),
    { key: 'total', header: 'Total', align: 'right', render: (f) => <span className="font-semibold text-slate-900">{formatQ(f.total)}</span> },
    { key: 'ver', header: '', sticky: true, render: () => <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description={TEXTOS[user.role]?.descripcion}
        actions={
          user.role !== 'cliente' && (
            <Button variant="secondary" icon={Download} loading={exportando} disabled={!facturas.data?.total} onClick={descargar}>
              Exportar CSV
            </Button>
          )
        }
      />
      {facturas.error && <Alert tone="error">{facturas.error}</Alert>}

      <Table
        columns={columnas}
        data={facturas.data?.items || []}
        loading={facturas.cargando}
        onRowClick={(f) => setAbierta(f._id)}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por número, nombre o NIT' }}
        aboveTable={
          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3">
            <Input label="Desde" name="desde" type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={cambiar} error={fechasInvalidas ? 'La fecha inicial no puede ser mayor a la final' : undefined} />
            <Input label="Hasta" name="hasta" type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={cambiar} />
            {user.role === 'admin' && (
              <Select
                label="Origen"
                name="origen"
                value={filtros.origen}
                onChange={cambiar}
                placeholder="Todos"
                options={[
                  { value: 'ORDEN', label: 'Órdenes entregadas' },
                  { value: 'POS', label: 'Punto de venta' },
                ]}
              />
            )}
            {hayFiltros && (
              <button
                type="button"
                onClick={() => {
                  setFiltros(FILTROS);
                  setTexto('');
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary sm:col-span-3"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Quitar filtros
              </button>
            )}
          </div>
        }
        pagination={facturas.data && { page: facturas.data.page, pages: facturas.data.pages, total: facturas.data.total, onPageChange: setPage }}
        emptyIcon={Receipt}
        emptyTitle={hayFiltros ? 'No hay facturas con esos filtros' : 'Aún no hay facturas'}
        emptyDescription={hayFiltros ? 'Prueba con otras fechas o quita los filtros.' : TEXTOS[user.role]?.vacio}
      />

      <FacturaModal facturaId={abierta} onClose={() => setAbierta(null)} />
    </div>
  );
}
