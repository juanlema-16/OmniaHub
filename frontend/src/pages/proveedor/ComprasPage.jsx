import { useEffect, useState } from 'react';
import { ChevronRight, PackagePlus, Plus } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { getPurchase, listPurchases } from '../../api/purchases';
import { listMyProducts } from '../../api/products';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import CompraFormModal from '../../components/proveedor/CompraFormModal';
import { formatQ } from '../../utils/formatQ';
import { formatFechaHora } from '../../utils/dates';
import { plural } from '../../utils/plural';

const unidadesDe = (c) => c.items.reduce((s, i) => s + i.cantidad, 0);

function DetalleCompra({ id, onClose }) {
  const { data: c, cargando, error } = useAsync(() => (id ? getPurchase(id) : Promise.resolve(null)), [id]);
  return (
    <Modal open={Boolean(id)} onClose={onClose} size="lg" title={c ? `Compra a ${c.origen}` : 'Compra'} description={c ? formatFechaHora(c.createdAt) : undefined}>
      {error && <Alert tone="error">{error}</Alert>}
      {cargando && <Skeleton className="h-40 w-full" />}
      {c && !cargando && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">Producto</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Cantidad</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Costo</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {c.items.map((i) => (
                  <tr key={i.product?._id}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <img src={i.product?.imagenes?.[0]} alt="" className="h-8 w-8 shrink-0 rounded-md border border-slate-200 object-cover" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{i.product?.nombre}</p>
                          <p className="text-xs text-slate-500">{i.product?.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">{i.cantidad}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{formatQ(i.costo)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{formatQ(i.cantidad * i.costo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">{plural(unidadesDe(c), 'unidad', 'unidades')}</span>
            <span className="text-base font-bold text-slate-900">Total: {formatQ(c.total)}</span>
          </div>
          {c.notas && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <strong className="text-slate-700">Notas:</strong> {c.notas}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function ComprasPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [fechas, setFechas] = useState({ desde: '', hasta: '' });
  const [page, setPage] = useState(1);
  const [registrar, setRegistrar] = useState(false);
  const [detalleId, setDetalleId] = useState(null);

  const productos = useAsync(() => listMyProducts({ limit: 100 }), []);
  const consulta = { search: search || undefined, desde: fechas.desde || undefined, hasta: fechas.hasta || undefined, page, limit: 10 };
  const compras = useAsync(() => listPurchases(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search, fechas.desde, fechas.hasta]);

  const hayFiltros = Boolean(search || fechas.desde || fechas.hasta);

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (c) => formatFechaHora(c.createdAt) },
    { key: 'origen', header: 'Proveedor de origen', render: (c) => <span className="font-medium text-slate-900">{c.origen}</span> },
    {
      key: 'productos',
      header: 'Productos',
      render: (c) => (
        <span title={c.items.map((i) => i.product?.nombre).join(', ')}>
          {plural(c.items.length, 'producto')} · {plural(unidadesDe(c), 'unidad', 'unidades')}
        </span>
      ),
    },
    { key: 'total', header: 'Total', align: 'right', render: (c) => <span className="font-semibold text-slate-900">{formatQ(c.total)}</span> },
    { key: 'ver', header: '', render: () => <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras de mercancía"
        description="Registra lo que compras para reponer tu inventario."
        actions={
          <Button icon={Plus} onClick={() => setRegistrar(true)}>
            Registrar compra
          </Button>
        }
      />
      {compras.error && <Alert tone="error">{compras.error}</Alert>}

      <Table
        columns={columnas}
        data={compras.data?.items || []}
        loading={compras.cargando}
        onRowClick={(c) => setDetalleId(c._id)}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por proveedor de origen' }}
        filters={
          <>
            <Input aria-label="Desde" type="date" value={fechas.desde} max={fechas.hasta || undefined} onChange={(e) => setFechas((f) => ({ ...f, desde: e.target.value }))} />
            <Input aria-label="Hasta" type="date" value={fechas.hasta} min={fechas.desde || undefined} onChange={(e) => setFechas((f) => ({ ...f, hasta: e.target.value }))} />
          </>
        }
        pagination={compras.data && { page: compras.data.page, pages: compras.data.pages, total: compras.data.total, onPageChange: setPage }}
        emptyIcon={PackagePlus}
        emptyTitle={hayFiltros ? 'No hay compras con esos filtros' : 'Aún no registras compras'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o fechas.' : 'Cuando compres mercancía, regístrala aquí para sumar el stock.'}
      />

      <CompraFormModal open={registrar} productos={productos.data?.items || []} onClose={() => setRegistrar(false)} onSaved={compras.recargar} />
      <DetalleCompra id={detalleId} onClose={() => setDetalleId(null)} />
    </div>
  );
}
