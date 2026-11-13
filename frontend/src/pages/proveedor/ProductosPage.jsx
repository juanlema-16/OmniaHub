import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { deactivateProduct, listMyProducts, updateProduct } from '../../api/products';
import { getCategories } from '../../api/catalog';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import ProductoFormModal from '../../components/proveedor/ProductoFormModal';
import ConfirmarModal from '../../components/proveedor/ConfirmarModal';
import { formatQ } from '../../utils/formatQ';

export default function ProductosPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [categoria, setCategoria] = useState('');
  const [activo, setActivo] = useState('');
  const [stockBajo, setStockBajo] = useState(false);
  const [page, setPage] = useState(1);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState('');

  const categorias = useAsync(getCategories, []);
  const consulta = { search: search || undefined, categoria: categoria || undefined, activo: activo || undefined, stockBajo: stockBajo || undefined, page, limit: 10 };
  const productos = useAsync(() => listMyProducts(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search, categoria, activo, stockBajo]);

  const hayFiltros = Boolean(search || categoria || activo || stockBajo);

  const alternar = async (p) => {
    setCambiandoId(p._id);
    try {
      const datos = new FormData();
      datos.append('activo', String(!p.activo));
      await updateProduct(p._id, datos);
      toast.success(p.activo ? `"${p.nombre}" desactivado` : `"${p.nombre}" activado`);
      productos.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCambiandoId('');
    }
  };

  const eliminar = async () => {
    setProcesando(true);
    try {
      const res = await deactivateProduct(eliminando._id);
      toast.success(res.message);
      setEliminando(null);
      productos.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcesando(false);
    }
  };

  const columnas = [
    {
      key: 'nombre',
      header: 'Producto',
      render: (p) => (
        <div className="flex max-w-64 items-center gap-3">
          <img src={p.imagenes?.[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{p.nombre}</p>
            <p className="text-xs text-slate-500">{p.sku}</p>
          </div>
        </div>
      ),
    },
    { key: 'categoria', header: 'Categoría', render: (p) => p.categoria?.nombre || '—' },
    {
      key: 'precios',
      header: 'Precios',
      render: (p) => (
        <div>
          <p className="font-medium text-slate-900">{formatQ(p.precioProveedor)}</p>
          <p className="text-xs text-slate-500">Sugerido {formatQ(p.precioSugerido)}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{p.stock}</span>
          {p.stock <= p.stockMinimo && <Badge tone={p.stock === 0 ? 'red' : 'amber'}>{p.stock === 0 ? 'Agotado' : 'Stock bajo'}</Badge>}
        </div>
      ),
    },
    {
      key: 'activo',
      header: 'Activo',
      render: (p) => (
        <Switch checked={p.activo} onChange={() => alternar(p)} disabled={cambiandoId === p._id} label={<span className="sr-only">{p.activo ? `Desactivar ${p.nombre}` : `Activar ${p.nombre}`}</span>} />
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" icon={Pencil} onClick={() => setEditando(p)} aria-label={`Editar ${p.nombre}`} title="Editar" />
          {p.activo && <Button variant="ghost" size="icon" icon={Trash2} onClick={() => setEliminando(p)} aria-label={`Eliminar ${p.nombre}`} title="Eliminar" className="text-danger hover:bg-red-50" />}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis productos"
        description="Publica y administra los productos que los dropshippers pueden vender."
        actions={
          <Button icon={Plus} onClick={() => setEditando({})}>
            Nuevo producto
          </Button>
        }
      />
      {productos.error && <Alert tone="error">{productos.error}</Alert>}

      <Table
        columns={columnas}
        data={productos.data?.items || []}
        loading={productos.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por nombre o SKU' }}
        filters={
          <>
            <Select aria-label="Filtrar por categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Todas las categorías" options={(categorias.data || []).map((c) => ({ value: c._id, label: c.nombre }))} className="min-w-44" />
            <Select
              aria-label="Filtrar por estado"
              value={activo}
              onChange={(e) => setActivo(e.target.value)}
              placeholder="Todos los estados"
              options={[
                { value: 'true', label: 'Activos' },
                { value: 'false', label: 'Inactivos' },
              ]}
              className="min-w-40"
            />
            <Switch checked={stockBajo} onChange={setStockBajo} label="Solo stock bajo" />
          </>
        }
        pagination={productos.data && { page: productos.data.page, pages: productos.data.pages, total: productos.data.total, onPageChange: setPage }}
        emptyIcon={Package}
        emptyTitle={hayFiltros ? 'No hay productos con esos filtros' : 'Aún no tienes productos'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : 'Publica tu primer producto con el botón Nuevo producto.'}
      />

      <ProductoFormModal producto={editando} categorias={categorias.data || []} onClose={() => setEditando(null)} onSaved={productos.recargar} />
      <ConfirmarModal open={Boolean(eliminando)} title="Eliminar producto" confirmLabel="Sí, eliminar" loading={procesando} onConfirm={eliminar} onClose={() => setEliminando(null)}>
        ¿Eliminar <strong className="text-slate-900">{eliminando?.nombre}</strong>? El producto se desactiva y se retira del catálogo y de las tiendas que lo importaron. Conservamos su historial de órdenes e inventario y puedes volver a activarlo cuando quieras.
      </ConfirmarModal>
    </div>
  );
}
