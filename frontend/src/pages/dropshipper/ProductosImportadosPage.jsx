import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, Pencil, Search, Send, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listStoreProducts, removeStoreProduct, updateStoreProduct } from '../../api/storeProducts';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import ImportarModal from '../../components/dropshipper/ImportarModal';
import CrearOrdenModal from '../../components/orders/CrearOrdenModal';
import { formatQ } from '../../utils/formatQ';

// El modal de precio y el de crear orden esperan un producto del catálogo
const comoProducto = (sp) => ({ ...sp.product, storeProduct: { _id: sp._id, precioVenta: sp.precioVenta, activo: sp.activo } });

export default function ProductosImportadosPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [activo, setActivo] = useState('');
  const [page, setPage] = useState(1);
  const [editar, setEditar] = useState(null);
  const [enviar, setEnviar] = useState(null);
  const [quitar, setQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);
  const consulta = { search: search || undefined, activo: activo || undefined, page, limit: 10 };
  const productos = useAsync(() => listStoreProducts(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search, activo]);

  const reemplazar = (id, cambios) => productos.setData((d) => d && { ...d, items: d.items.map((sp) => (sp._id === id ? { ...sp, ...cambios } : sp)) });

  const alternar = async (sp) => {
    reemplazar(sp._id, { activo: !sp.activo });
    try {
      await updateStoreProduct(sp._id, { activo: !sp.activo });
      toast.success(sp.activo ? 'Producto oculto de tu tienda' : 'Producto visible en tu tienda');
    } catch (err) {
      reemplazar(sp._id, { activo: sp.activo });
      toast.error(getErrorMessage(err));
    }
  };

  const confirmarQuitar = async () => {
    setQuitando(true);
    try {
      await removeStoreProduct(quitar._id);
      toast.success(`${quitar.product.nombre} se quitó de tu tienda`);
      setQuitar(null);
      productos.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setQuitando(false);
    }
  };

  const columnas = [
    {
      key: 'producto',
      header: 'Producto',
      render: (sp) => (
        <div className="flex max-w-72 items-center gap-3">
          <img src={sp.product.imagenes?.[0]} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover" />
          <div className="min-w-0">
            <Link to={`/dropshipper/catalogo/${sp.product._id}`} className="block truncate font-medium text-slate-900 hover:text-primary">
              {sp.product.nombre}
            </Link>
            <p className="text-xs text-slate-500">
              {sp.product.sku} · {sp.product.proveedor?.empresa?.nombre}
            </p>
            {!sp.product.activo && (
              <Badge tone="red" className="mt-1">
                Retirado por el proveedor
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    { key: 'precioProveedor', header: 'Precio proveedor', align: 'right', render: (sp) => <span className="text-slate-500">{formatQ(sp.product.precioProveedor)}</span> },
    {
      key: 'precioVenta',
      header: 'Precio de venta',
      align: 'right',
      render: (sp) => (
        <button type="button" onClick={() => setEditar(comoProducto(sp))} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-slate-900 hover:bg-slate-100" aria-label={`Cambiar precio de ${sp.product.nombre}`}>
          {formatQ(sp.precioVenta)} <Pencil className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        </button>
      ),
    },
    { key: 'margen', header: 'Margen', align: 'right', render: (sp) => <span className="font-semibold text-success">{formatQ(sp.margen)}</span> },
    {
      key: 'stock',
      header: 'Stock',
      align: 'center',
      render: (sp) => <span className={`font-medium ${sp.product.stock <= 0 ? 'text-danger' : sp.product.stockBajo ? 'text-warning' : 'text-slate-700'}`}>{sp.product.stock <= 0 ? 'Agotado' : sp.product.stock}</span>,
    },
    {
      key: 'activo',
      header: 'En tienda',
      align: 'center',
      render: (sp) => <Switch checked={sp.activo} onChange={() => alternar(sp)} disabled={!sp.product.activo} label={<span className="sr-only">Mostrar {sp.product.nombre} en la tienda</span>} />,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (sp) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="soft" icon={Send} onClick={() => setEnviar(sp)} disabled={!sp.product.activo || sp.product.stock <= 0}>
            Enviar
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setQuitar(sp)} aria-label={`Quitar ${sp.product.nombre} de la tienda`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis productos"
        description="Los productos que importaste a tu tienda, con tu precio de venta y tu margen."
        actions={
          <Link to="/dropshipper/catalogo" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-hover">
            <Search className="h-4 w-4" aria-hidden="true" /> Buscar en el catálogo
          </Link>
        }
      />
      {productos.error && <Alert tone="error">{productos.error}</Alert>}
      <Table
        columns={columnas}
        data={productos.data?.items || []}
        loading={productos.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por nombre o SKU' }}
        filters={
          <Select
            aria-label="Estado en la tienda"
            value={activo}
            onChange={(e) => setActivo(e.target.value)}
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Visibles en tienda' },
              { value: 'false', label: 'Ocultos' },
            ]}
            className="w-44"
          />
        }
        pagination={productos.data && { page: productos.data.page, pages: productos.data.pages, total: productos.data.total, onPageChange: setPage }}
        emptyIcon={Package}
        emptyTitle={search || activo ? 'No hay productos con esos filtros' : 'Aún no importas productos'}
        emptyDescription={search || activo ? 'Prueba con otra búsqueda.' : 'Ve al catálogo y usa “Importar a mi tienda” para empezar a vender.'}
      />

      {editar && <ImportarModal producto={editar} onClose={() => setEditar(null)} onDone={() => productos.recargar()} />}
      <CrearOrdenModal open={Boolean(enviar)} producto={enviar?.product} precioVenta={enviar?.precioVenta} onClose={() => setEnviar(null)} />
      <Modal
        open={Boolean(quitar)}
        onClose={() => setQuitar(null)}
        size="sm"
        title="¿Quitar de tu tienda?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setQuitar(null)} disabled={quitando}>
              Cancelar
            </Button>
            <Button variant="danger" icon={Trash2} loading={quitando} onClick={confirmarQuitar}>
              Quitar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <strong className="text-slate-900">{quitar?.product.nombre}</strong> dejará de aparecer en tu tienda en línea. Las órdenes que ya creaste no cambian y puedes volver a importarlo cuando quieras.
        </p>
      </Modal>
    </div>
  );
}
