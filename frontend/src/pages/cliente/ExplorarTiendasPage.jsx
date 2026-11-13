import { useEffect, useState } from 'react';
import { Search, Store } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listStores } from '../../api/public';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import TiendaCard from '../../components/store/TiendaCard';

const LOTE = 9;

// Directorio de tiendas activas con KYC aprobado: de aquí el cliente llega a cualquier tienda
export default function ExplorarTiendasPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [pagina, setPagina] = useState(1);
  const [tiendas, setTiendas] = useState([]);
  const consulta = useAsync(() => listStores({ search: search || undefined, page: pagina, limit: LOTE }), [search, pagina]);

  useEffect(() => {
    setPagina(1);
    setTiendas([]);
  }, [search]);

  useEffect(() => {
    if (consulta.data) setTiendas((previas) => (consulta.data.page === 1 ? consulta.data.items : [...previas, ...consulta.data.items]));
  }, [consulta.data]);

  const hayMas = consulta.data && consulta.data.page < consulta.data.pages;

  return (
    <div>
      <PageHeader title="Explorar tiendas" description="Elige una tienda de OmniaHub y compra con envío a todo el país y pago contra entrega." />
      <div className="mb-6 max-w-md">
        <Input aria-label="Buscar tienda" icon={Search} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar una tienda por nombre" />
      </div>
      {consulta.error && <Alert tone="error">{consulta.error}</Alert>}
      {consulta.cargando && !tiendas.length && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      )}
      {!consulta.cargando && consulta.data && !tiendas.length && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState icon={Store} title="No encontramos tiendas" description={search ? 'Prueba con otro nombre.' : 'Pronto habrá tiendas disponibles.'} />
        </div>
      )}
      {tiendas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tiendas.map((t) => (
            <TiendaCard key={t.slug} tienda={t} />
          ))}
        </div>
      )}
      {hayMas && (
        <div className="mt-6 text-center">
          <Button variant="secondary" loading={consulta.cargando} onClick={() => setPagina((p) => p + 1)}>
            Ver más tiendas
          </Button>
        </div>
      )}
    </div>
  );
}
