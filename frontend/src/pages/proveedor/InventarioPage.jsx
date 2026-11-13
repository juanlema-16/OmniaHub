import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Boxes, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getLowStock, listMovements } from '../../api/inventory';
import { listMyProducts } from '../../api/products';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AjusteStockModal from '../../components/proveedor/AjusteStockModal';
import { formatFechaHora } from '../../utils/dates';
import { plural } from '../../utils/plural';

const TIPOS = {
  ENTRADA_COMPRA: { label: 'Entrada por compra', tone: 'green' },
  SALIDA_VENTA: { label: 'Salida por venta', tone: 'sky' },
  AJUSTE: { label: 'Ajuste', tone: 'amber' },
  DEVOLUCION: { label: 'Devolución', tone: 'violet' },
};

const Producto = ({ p }) => (
  <div className="flex max-w-64 items-center gap-3">
    <img src={p?.imagenes?.[0]} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover" />
    <div className="min-w-0">
      <p className="truncate font-medium text-slate-900">{p?.nombre}</p>
      <p className="text-xs text-slate-500">{p?.sku}</p>
    </div>
  </div>
);

function Movimientos({ onAjustar }) {
  const [tipo, setTipo] = useState('');
  const [product, setProduct] = useState('');
  const [fechas, setFechas] = useState({ desde: '', hasta: '' });
  const [page, setPage] = useState(1);

  const productos = useAsync(() => listMyProducts({ limit: 100 }), []);
  const consulta = { tipo: tipo || undefined, product: product || undefined, desde: fechas.desde || undefined, hasta: fechas.hasta || undefined, page, limit: 10 };
  const movimientos = useAsync(() => listMovements(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [tipo, product, fechas.desde, fechas.hasta]);

  const hayFiltros = Boolean(tipo || product || fechas.desde || fechas.hasta);

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (m) => formatFechaHora(m.createdAt) },
    { key: 'producto', header: 'Producto', render: (m) => <Producto p={m.product} /> },
    { key: 'tipo', header: 'Tipo', render: (m) => <Badge tone={TIPOS[m.tipo]?.tone}>{TIPOS[m.tipo]?.label || m.tipo}</Badge> },
    {
      key: 'cantidad',
      header: 'Cantidad',
      align: 'right',
      render: (m) => (
        <span className={`inline-flex items-center gap-1 font-semibold ${m.cantidad >= 0 ? 'text-success' : 'text-danger'}`}>
          {m.cantidad >= 0 ? <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
          {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
        </span>
      ),
    },
    { key: 'stock', header: 'Stock', align: 'right', render: (m) => `${m.stockPrevio} → ${m.stockNuevo}` },
    { key: 'referencia', header: 'Referencia', render: (m) => <span className="block max-w-56 truncate" title={m.referencia}>{m.referencia || '—'}</span> },
    { key: 'user', header: 'Usuario', render: (m) => (m.user ? `${m.user.nombre} ${m.user.apellido}` : '—') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" icon={SlidersHorizontal} onClick={() => onAjustar(null)}>
          Ajustar stock
        </Button>
      </div>
      {movimientos.error && <Alert tone="error">{movimientos.error}</Alert>}
      <Table
        columns={columnas}
        data={movimientos.data?.items || []}
        loading={movimientos.cargando}
        filters={
          <>
            <Select aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Todos los tipos" options={Object.entries(TIPOS).map(([value, t]) => ({ value, label: t.label }))} className="min-w-44" />
            <Select aria-label="Filtrar por producto" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Todos los productos" options={(productos.data?.items || []).map((p) => ({ value: p._id, label: p.nombre }))} className="min-w-48 max-w-full" />
            <Input aria-label="Desde" type="date" value={fechas.desde} max={fechas.hasta || undefined} onChange={(e) => setFechas((f) => ({ ...f, desde: e.target.value }))} />
            <Input aria-label="Hasta" type="date" value={fechas.hasta} min={fechas.desde || undefined} onChange={(e) => setFechas((f) => ({ ...f, hasta: e.target.value }))} />
          </>
        }
        pagination={movimientos.data && { page: movimientos.data.page, pages: movimientos.data.pages, total: movimientos.data.total, onPageChange: setPage }}
        emptyIcon={Boxes}
        emptyTitle={hayFiltros ? 'No hay movimientos con esos filtros' : 'Aún no hay movimientos'}
        emptyDescription={hayFiltros ? 'Prueba con otros filtros.' : 'Los movimientos aparecen con compras, ventas y ajustes.'}
      />
    </div>
  );
}

function StockBajo({ onAjustar, version }) {
  const { data, cargando, error } = useAsync(getLowStock, [version]);
  const lista = data || [];

  const columnas = [
    { key: 'producto', header: 'Producto', render: (p) => <Producto p={p} /> },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (p) => (
        <span className={`font-semibold ${p.stock === 0 ? 'text-danger' : 'text-warning'}`}>
          {p.stock === 0 ? 'Agotado' : p.stock}
        </span>
      ),
    },
    { key: 'stockMinimo', header: 'Mínimo', align: 'right' },
    {
      key: 'faltan',
      header: 'Para llegar al mínimo',
      align: 'right',
      render: (p) => plural(Math.max(0, p.stockMinimo - p.stock + 1), 'unidad', 'unidades'),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (p) => (
        <Button size="sm" variant="soft" onClick={() => onAjustar(p)}>
          Ajustar stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {!cargando && lista.length > 0 && (
        <Alert tone="warning" title={`${plural(lista.length, 'producto tiene', 'productos tienen')} stock bajo`}>
          Registra una compra o ajusta el inventario para no quedarte sin existencias.
        </Alert>
      )}
      <Table
        columns={columnas}
        data={lista}
        loading={cargando}
        emptyIcon={TriangleAlert}
        emptyTitle="Todo en orden"
        emptyDescription="Ningún producto activo está en o por debajo de su stock mínimo."
      />
    </div>
  );
}

export default function InventarioPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'stock-bajo' ? 'stock-bajo' : 'movimientos';
  const [ajuste, setAjuste] = useState(null);
  const [version, setVersion] = useState(0);
  const [elegir, setElegir] = useState(false);
  const productos = useAsync(() => listMyProducts({ limit: 100, activo: true }), [version]);
  const bajo = useAsync(getLowStock, [version]);

  const abrirAjuste = (producto) => {
    if (producto) setAjuste(producto);
    else setElegir(true);
  };

  const tabs = [
    { value: 'movimientos', label: 'Movimientos' },
    { value: 'stock-bajo', label: 'Stock bajo', count: bajo.data?.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventario" description="Historial de movimientos y productos que necesitan reposición." />
      <Tabs tabs={tabs} value={tab} onChange={(v) => setParams(v === 'movimientos' ? {} : { tab: v }, { replace: true })} />
      {tab === 'movimientos' ? <Movimientos key={version} onAjustar={abrirAjuste} /> : <StockBajo onAjustar={abrirAjuste} version={version} />}

      {elegir && (
        <SelectorProducto
          productos={productos.data?.items || []}
          cargando={productos.cargando}
          onClose={() => setElegir(false)}
          onElegir={(p) => {
            setElegir(false);
            setAjuste(p);
          }}
        />
      )}
      <AjusteStockModal producto={ajuste} onClose={() => setAjuste(null)} onSaved={() => setVersion((v) => v + 1)} />
    </div>
  );
}

function SelectorProducto({ productos, cargando, onClose, onElegir }) {
  const [id, setId] = useState('');
  return (
    <Modal open onClose={onClose} size="sm" title="Ajustar stock" description="Elige el producto que quieres ajustar." footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={!id} onClick={() => onElegir(productos.find((p) => p._id === id))}>
          Continuar
        </Button>
      </>
    }>
      <Select label="Producto" value={id} onChange={(e) => setId(e.target.value)} placeholder={cargando ? 'Cargando…' : 'Elige un producto'} options={productos.map((p) => ({ value: p._id, label: `${p.nombre} (stock ${p.stock})` }))} />
    </Modal>
  );
}
