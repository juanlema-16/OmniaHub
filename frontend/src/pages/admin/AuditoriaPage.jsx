import { useEffect, useState } from 'react';
import { ScrollText, SlidersHorizontal, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listAudit } from '../../api/admin';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import AuditoriaDetalle, { accionLegible } from '../../components/admin/AuditoriaDetalle';
import { formatFechaHora } from '../../utils/dates';
import { ROLES } from '../../utils/constants';

const ENTIDADES = ['Order', 'User', 'TopUp', 'Withdrawal', 'BankAccount', 'CashSession', 'Setting', 'Carrier', 'Banner', 'Policy', 'Review', 'Ticket'];
const ETIQUETA_ENTIDAD = {
  Order: 'Orden',
  User: 'Usuario',
  TopUp: 'Recarga',
  Withdrawal: 'Retiro',
  BankAccount: 'Cuenta bancaria',
  CashSession: 'Caja',
  Setting: 'Configuración',
  Carrier: 'Transportadora',
  Banner: 'Banner',
  Policy: 'Política',
  Review: 'Reseña',
  Ticket: 'Ticket',
};
const EXTRA = { entidad: '', desde: '', hasta: '' };

export default function AuditoriaPage() {
  const [texto, setTexto] = useState('');
  const accion = useDebounce(texto, 350);
  const [extra, setExtra] = useState(EXTRA);
  const [usuario, setUsuario] = useState(null);
  const [verFiltros, setVerFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const [detalle, setDetalle] = useState(null);

  const consulta = {
    accion: accion.trim() || undefined,
    user: usuario?._id,
    ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)),
    page,
    limit: 15,
  };
  const registros = useAsync(() => listAudit(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [accion, extra, usuario]);

  const filtrosActivos = Object.values(extra).filter(Boolean).length + (usuario ? 1 : 0);
  const cambiarExtra = (e) => setExtra((f) => ({ ...f, [e.target.name]: e.target.value }));
  const hayFiltros = Boolean(accion.trim() || filtrosActivos);

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (r) => <span className="text-slate-600">{formatFechaHora(r.fecha)}</span> },
    {
      key: 'user',
      header: 'Usuario',
      render: (r) =>
        r.user ? (
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUsuario(r.user);
              }}
              className="text-left font-medium text-slate-900 hover:text-primary hover:underline"
              title="Filtrar por este usuario"
            >
              {r.user.nombre} {r.user.apellido}
            </button>
            <p className="text-xs text-slate-500">{ROLES[r.user.role]?.label}</p>
          </div>
        ) : (
          <span className="text-slate-400">Sistema</span>
        ),
    },
    { key: 'accion', header: 'Acción', render: (r) => <span className="font-medium text-slate-800">{accionLegible(r.accion)}</span> },
    { key: 'entidad', header: 'Entidad', render: (r) => <Badge tone="slate">{ETIQUETA_ENTIDAD[r.entidad] || r.entidad}</Badge> },
    {
      key: 'detalle',
      header: 'Resumen',
      render: (r) => {
        const claves = r.detalle ? Object.keys(r.detalle) : [];
        const texto = r.resumen || (claves.length ? claves.map(accionLegible).join(', ') : 'Sin detalle');
        return <span className="block max-w-80 truncate text-slate-600" title={texto}>{texto}</span>;
      },
    },
    {
      key: 'ver',
      header: '',
      align: 'right',
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => setDetalle(r)} aria-label={`Ver detalle de ${accionLegible(r.accion)}`}>
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoría" description="Bitácora de quién hizo qué y cuándo: correcciones, aprobaciones, bloqueos y cambios de configuración." />
      {registros.error && <Alert tone="error">{registros.error}</Alert>}
      {usuario && (
        <Alert tone="info" action={<Button size="sm" variant="secondary" icon={X} onClick={() => setUsuario(null)}>Quitar</Button>}>
          Mostrando solo las acciones de {usuario.nombre} {usuario.apellido}.
        </Alert>
      )}
      <Table
        columns={columnas}
        data={registros.data?.items || []}
        loading={registros.cargando}
        rowKey="_id"
        onRowClick={setDetalle}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por acción (ej. KYC, RETIRO, ESTADO)' }}
        filters={
          <Button variant={filtrosActivos ? 'soft' : 'secondary'} size="sm" icon={SlidersHorizontal} onClick={() => setVerFiltros((v) => !v)} aria-expanded={verFiltros}>
            Filtros{filtrosActivos ? ` (${filtrosActivos})` : ''}
          </Button>
        }
        pagination={registros.data && { page: registros.data.page, pages: registros.data.pages, total: registros.data.total, onPageChange: setPage }}
        emptyIcon={ScrollText}
        emptyTitle={hayFiltros ? 'No hay registros con esos filtros' : 'Aún no hay registros'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : 'Las acciones importantes quedan registradas aquí.'}
        aboveTable={
          verFiltros && (
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3">
              <Select label="Entidad" name="entidad" value={extra.entidad} onChange={cambiarExtra} placeholder="Todas" options={ENTIDADES.map((value) => ({ value, label: ETIQUETA_ENTIDAD[value] }))} />
              <Input label="Desde" name="desde" type="date" value={extra.desde} max={extra.hasta || undefined} onChange={cambiarExtra} />
              <Input label="Hasta" name="hasta" type="date" value={extra.hasta} min={extra.desde || undefined} onChange={cambiarExtra} />
              {filtrosActivos > 0 && (
                <button type="button" onClick={() => { setExtra(EXTRA); setUsuario(null); }} className="inline-flex items-center gap-1 text-sm font-medium text-primary sm:col-span-3">
                  <X className="h-4 w-4" aria-hidden="true" /> Quitar filtros
                </button>
              )}
            </div>
          )
        }
      />
      <AuditoriaDetalle registro={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}
