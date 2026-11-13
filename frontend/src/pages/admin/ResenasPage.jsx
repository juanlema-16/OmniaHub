import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, MessageSquareText } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listAllReviews, setReviewVisible } from '../../api/reviews';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import Estrellas from '../../components/ui/Estrellas';
import { formatFecha } from '../../utils/dates';

const TABS = [
  { value: '', label: 'Todas' },
  { value: 'true', label: 'Visibles' },
  { value: 'false', label: 'Ocultas' },
];

export default function ResenasPage() {
  const [visible, setVisible] = useState('');
  const [rating, setRating] = useState('');
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [confirmar, setConfirmar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const consulta = { visible: visible || undefined, rating: rating || undefined, search: search || undefined, page, limit: 10 };
  const resenas = useAsync(() => listAllReviews(consulta), [JSON.stringify(consulta)]);
  useEffect(() => setPage(1), [visible, rating, search]);

  const cambiarVisibilidad = async (r, nuevo) => {
    setGuardando(true);
    try {
      await setReviewVisible(r._id, nuevo);
      toast.success(nuevo ? 'La reseña vuelve a ser visible' : 'Reseña oculta: ya no aparece en la tienda ni en el catálogo');
      setConfirmar(null);
      resenas.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const columnas = [
    {
      key: 'producto',
      header: 'Producto',
      render: (r) => (
        <div className="flex max-w-56 items-center gap-2.5">
          <img src={r.product?.imagenes?.[0]} alt="" className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{r.product?.nombre}</p>
            <p className="text-xs text-slate-500">{r.order?.numero}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (r) => (
        <div>
          <p className="text-slate-800">
            {r.cliente?.nombre} {r.cliente?.apellido}
          </p>
          <p className="text-xs text-slate-500">{formatFecha(r.createdAt)}</p>
        </div>
      ),
    },
    { key: 'rating', header: 'Calificación', render: (r) => <Estrellas valor={r.rating} /> },
    { key: 'comentario', header: 'Comentario', render: (r) => <p className="line-clamp-3 min-w-64 max-w-md whitespace-normal text-slate-600">{r.comentario}</p> },
    { key: 'estado', header: 'Estado', render: (r) => (r.visible ? <Badge tone="green" dot>Visible</Badge> : <Badge tone="slate" dot>Oculta</Badge>) },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (r) =>
        r.visible ? (
          <Button size="sm" variant="secondary" icon={EyeOff} onClick={() => setConfirmar(r)}>
            Ocultar
          </Button>
        ) : (
          <Button size="sm" variant="soft" icon={Eye} loading={guardando} onClick={() => cambiarVisibilidad(r, true)}>
            Mostrar
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reseñas" description="Modera las opiniones de los clientes: oculta las inapropiadas y vuelve a mostrarlas si fue un error." />
      <Tabs tabs={TABS} value={visible} onChange={setVisible} />
      {resenas.error && <Alert tone="error">{resenas.error}</Alert>}
      <Table
        columns={columnas}
        data={resenas.data?.items || []}
        loading={resenas.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por producto, cliente o comentario' }}
        filters={<Select aria-label="Calificación" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="Toda calificación" options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? 'estrella' : 'estrellas'}` }))} className="w-44" />}
        pagination={resenas.data && { page: resenas.data.page, pages: resenas.data.pages, total: resenas.data.total, onPageChange: setPage }}
        emptyIcon={MessageSquareText}
        emptyTitle={visible || rating || search ? 'No hay reseñas con esos filtros' : 'Aún no hay reseñas'}
        emptyDescription={visible || rating || search ? 'Prueba con otra búsqueda.' : 'Cuando un cliente califique un producto entregado aparecerá aquí.'}
      />

      <Modal
        open={Boolean(confirmar)}
        onClose={() => setConfirmar(null)}
        size="sm"
        title="¿Ocultar esta reseña?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmar(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="danger" icon={EyeOff} loading={guardando} onClick={() => cambiarVisibilidad(confirmar, false)}>
              Ocultar
            </Button>
          </>
        }
      >
        {confirmar && (
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Dejará de verse en la tienda pública y en el catálogo, y no contará en el promedio de <strong>{confirmar.product?.nombre}</strong>.
            </p>
            <blockquote className="rounded-lg bg-slate-50 p-3 italic text-slate-600">“{confirmar.comentario}”</blockquote>
          </div>
        )}
      </Modal>
    </div>
  );
}
