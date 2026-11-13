import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Star } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listOrders } from '../../api/orders';
import { listMyReviews } from '../../api/reviews';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import { OrderStatusBadge } from '../../components/ui/Badge';
import OrderQuickView from '../../components/orders/OrderQuickView';
import CalificarModal from '../../components/reviews/CalificarModal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatQ } from '../../utils/formatQ';
import { formatFecha } from '../../utils/dates';
import { ORDER_STATUS } from '../../utils/constants';

export default function PedidosPage() {
  const [estado, setEstado] = useState('');
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [ordenId, setOrdenId] = useState(null);
  const [calificar, setCalificar] = useState(null);

  const consulta = { estado: estado || undefined, search: search || undefined, page, limit: 10 };
  const ordenes = useAsync(() => listOrders(consulta), [JSON.stringify(consulta)]);
  const resenas = useAsync(listMyReviews, []);
  useEffect(() => setPage(1), [estado, search]);

  const porEstado = ordenes.data?.porEstado || {};
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const tabs = [{ value: '', label: 'Todos', count: total }, ...Object.entries(ORDER_STATUS).filter(([v]) => porEstado[v] || v === estado).map(([value, s]) => ({ value, label: s.label, count: porEstado[value] || 0 }))];

  const columnas = [
    {
      key: 'numero',
      header: 'Pedido',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.numero}</p>
          <p className="text-xs text-slate-500">{formatFecha(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'productos',
      header: 'Productos',
      render: (o) => (
        <div className="flex max-w-64 items-center gap-2.5">
          <img src={o.items[0]?.imagen} alt="" className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-slate-800">{o.items[0]?.nombre}</p>
            {o.items.length > 1 && <p className="text-xs text-slate-500">y {o.items.length - 1} más</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'destino',
      header: 'Entrega en',
      render: (o) => (
        <div>
          <p className="text-slate-800">{o.destino.municipio}</p>
          <p className="text-xs text-slate-500">{o.destino.departamento}</p>
        </div>
      ),
    },
    { key: 'guia', header: 'Guía', render: (o) => o.guia || <span className="text-slate-400">Aún sin guía</span> },
    { key: 'estado', header: 'Estado', render: (o) => <OrderStatusBadge estado={o.estado} /> },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <span className="font-semibold text-slate-900">{formatQ(o.total)}</span> },
    {
      key: 'resena',
      header: 'Reseña',
      render: (o) => {
        if (o.estado !== 'ENTREGADO') return <span className="text-slate-300">—</span>;
        const hechas = (resenas.data || []).filter((r) => r.order === o._id).length;
        return hechas >= o.items.length ? (
          <Badge tone="green">Calificado</Badge>
        ) : (
          <Button
            size="sm"
            variant="soft"
            icon={Star}
            onClick={(e) => {
              e.stopPropagation();
              setCalificar(o);
            }}
          >
            Calificar
          </Button>
        );
      },
    },
    { key: 'ver', header: '', render: () => <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Mis pedidos" description="Sigue tus compras desde que las haces hasta que llegan a tu puerta." />
      <Tabs tabs={tabs} value={estado} onChange={setEstado} />
      {ordenes.error && <Alert tone="error">{ordenes.error}</Alert>}
      <Table
        columns={columnas}
        data={ordenes.data?.items || []}
        loading={ordenes.cargando}
        onRowClick={(o) => setOrdenId(o._id)}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por número de pedido o guía' }}
        pagination={ordenes.data && { page: ordenes.data.page, pages: ordenes.data.pages, total: ordenes.data.total, onPageChange: setPage }}
        emptyIcon={ShoppingBag}
        emptyTitle={estado || search ? 'No hay pedidos con esos filtros' : 'Aún no tienes pedidos'}
        emptyDescription={
          estado || search ? 'Prueba con otra búsqueda.' : (
            <>
              Cuando compres en una tienda de OmniaHub, tus pedidos aparecerán aquí.{' '}
              <Link to="/cliente/tiendas" className="font-medium text-primary hover:underline">
                Explorar tiendas
              </Link>
            </>
          )
        }
      />
      <OrderQuickView orderId={ordenId} onClose={() => setOrdenId(null)} />
      <CalificarModal orden={calificar} resenas={resenas.data || []} onClose={() => setCalificar(null)} onSaved={resenas.recargar} />
    </div>
  );
}
