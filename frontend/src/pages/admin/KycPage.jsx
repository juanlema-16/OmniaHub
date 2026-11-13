import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listKyc } from '../../api/admin';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import KycRevisionModal from '../../components/admin/KycRevisionModal';
import { formatFechaHora } from '../../utils/dates';
import { ROLES } from '../../utils/constants';

const TABS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'rechazado', label: 'Rechazados' },
];

const VACIOS = {
  pendiente: 'No hay verificaciones pendientes',
  aprobado: 'Aún no has aprobado identidades',
  rechazado: 'No has rechazado verificaciones',
};

export default function KycPage() {
  const [status, setStatus] = useState('pendiente');
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [revisar, setRevisar] = useState(null);

  const lista = useAsync(() => listKyc({ status, search: search || undefined, page, limit: 10 }), [status, search, page, version]);
  // Conteo de cada pestaña (limit 1: solo interesa el total)
  const conteos = useAsync(async () => {
    const totales = await Promise.all(TABS.map((t) => listKyc({ status: t.value, limit: 1 })));
    return Object.fromEntries(TABS.map((t, i) => [t.value, totales[i].total]));
  }, [version]);

  useEffect(() => setPage(1), [status, search]);

  const tabs = TABS.map((t) => ({ ...t, count: conteos.data?.[t.value] }));
  const recargar = () => setVersion((v) => v + 1);

  const columnas = [
    {
      key: 'usuario',
      header: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar nombre={u.nombre} apellido={u.apellido} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-slate-900">
              {u.nombre} {u.apellido}
            </p>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Rol', render: (u) => <Badge tone="indigo">{ROLES[u.role]?.label}</Badge> },
    { key: 'negocio', header: 'Negocio', render: (u) => u.tienda?.nombre || u.empresa?.nombre || <span className="text-slate-400">—</span> },
    { key: 'enviado', header: 'Enviado', render: (u) => <span className="text-slate-600">{formatFechaHora(u.kyc.enviadoEn)}</span> },
    { key: 'revisado', header: 'Revisado', render: (u) => <span className="text-slate-600">{u.kyc.revisadoEn ? formatFechaHora(u.kyc.revisadoEn) : '—'}</span> },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (u) => (
        <Button size="sm" variant={status === 'pendiente' ? 'primary' : 'ghost'} onClick={() => setRevisar(u)} aria-label={`${status === 'pendiente' ? 'Revisar' : 'Ver'} documentos de ${u.nombre} ${u.apellido}`}>
          {status === 'pendiente' ? 'Revisar' : 'Ver'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Verificación de identidad" description="Revisa el DPI y la selfie de proveedores y dropshippers para habilitar sus ventas y retiros." />
      <Tabs tabs={tabs} value={status} onChange={setStatus} />
      {lista.error && <Alert tone="error">{lista.error}</Alert>}
      <Table
        columns={columnas}
        data={lista.data?.items || []}
        loading={lista.cargando}
        onRowClick={setRevisar}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por nombre, correo o negocio' }}
        pagination={lista.data && { page: lista.data.page, pages: lista.data.pages, total: lista.data.total, onPageChange: setPage }}
        emptyIcon={ShieldCheck}
        emptyTitle={search ? 'No hay resultados con esa búsqueda' : VACIOS[status]}
        emptyDescription={search ? 'Prueba con otro nombre o correo.' : undefined}
      />
      <KycRevisionModal usuario={revisar} onClose={() => setRevisar(null)} onReviewed={recargar} />
    </div>
  );
}
