import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, LifeBuoy, Plus, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { listTickets } from '../../api/tickets';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import TicketNuevoModal from '../../components/tickets/TicketNuevoModal';
import TicketConversacion from '../../components/tickets/TicketConversacion';
import { ROLES, TICKET_CATEGORIA, TICKET_ESTADO, TICKET_PRIORIDAD } from '../../utils/constants';
import { formatRelativa } from '../../utils/dates';
import { plural } from '../../utils/plural';

// Soporte para todos los roles: cada usuario ve sus tickets y el admin atiende la bandeja completa.
// Las notificaciones abren un ticket directo con ?ticket=<id>.
export default function SoportePage() {
  const { user } = useAuth();
  const esAdmin = user.role === 'admin';
  const [params, setParams] = useSearchParams();
  const [estado, setEstado] = useState(esAdmin ? 'ABIERTO' : '');
  const [prioridad, setPrioridad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [nuevo, setNuevo] = useState(false);

  const abierto = params.get('ticket');
  const abrir = (id) => setParams(id ? { ticket: id } : {}, { replace: true });

  const consulta = { estado: estado || undefined, prioridad: prioridad || undefined, categoria: categoria || undefined, search: search || undefined, page, limit: 10 };
  const tickets = useAsync(() => listTickets(consulta), [JSON.stringify(consulta)]);
  useEffect(() => setPage(1), [estado, prioridad, categoria, search]);

  const porEstado = tickets.data?.porEstado || {};
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const tabs = [{ value: '', label: 'Todos', count: total }, ...Object.entries(TICKET_ESTADO).map(([value, s]) => ({ value, label: s.label, count: porEstado[value] || 0 }))];
  const hayFiltros = Boolean(estado || prioridad || categoria || search);

  const columnas = [
    {
      key: 'ticket',
      header: 'Ticket',
      render: (t) => (
        <div className="max-w-xs">
          <p className="font-semibold text-slate-900">{t.numero}</p>
          <p className="truncate text-slate-600" title={t.asunto}>
            {t.asunto}
          </p>
        </div>
      ),
    },
    ...(esAdmin
      ? [
          {
            key: 'usuario',
            header: 'Usuario',
            render: (t) => (
              <div>
                <p className="text-slate-800">
                  {t.user?.nombre} {t.user?.apellido}
                </p>
                <p className="text-xs text-slate-500">{ROLES[t.user?.role]?.label}</p>
              </div>
            ),
          },
        ]
      : []),
    { key: 'categoria', header: 'Categoría', render: (t) => TICKET_CATEGORIA[t.categoria] },
    { key: 'prioridad', header: 'Prioridad', render: (t) => <Badge tone={TICKET_PRIORIDAD[t.prioridad].tone}>{TICKET_PRIORIDAD[t.prioridad].label}</Badge> },
    {
      key: 'estado',
      header: 'Estado',
      render: (t) => (
        <Badge tone={TICKET_ESTADO[t.estado].tone} dot>
          {TICKET_ESTADO[t.estado].label}
        </Badge>
      ),
    },
    {
      key: 'actividad',
      header: 'Última actividad',
      render: (t) => (
        <div>
          <p className="whitespace-nowrap text-slate-700">{formatRelativa(t.updatedAt)}</p>
          <p className="text-xs text-slate-500">
            {plural(t.totalMensajes, 'mensaje')}
            {t.ultimoMensaje && ` · ${t.ultimoMensaje.rol === 'admin' ? 'responde soporte' : 'espera respuesta'}`}
          </p>
        </div>
      ),
    },
    { key: 'ver', header: '', sticky: true, render: () => <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soporte"
        description={esAdmin ? 'Bandeja de tickets de todos los usuarios.' : 'Escríbenos si tienes un problema con un pedido, un pago o tu cuenta.'}
        actions={
          // El admin atiende los tickets de los usuarios; no abre tickets propios
          !esAdmin && (
            <Button icon={Plus} onClick={() => setNuevo(true)}>
              Nuevo ticket
            </Button>
          )
        }
      />

      <Tabs tabs={tabs} value={estado} onChange={setEstado} />
      {tickets.error && <Alert tone="error">{tickets.error}</Alert>}

      <Table
        columns={columnas}
        data={tickets.data?.items || []}
        loading={tickets.cargando}
        onRowClick={(t) => abrir(t._id)}
        search={{ value: texto, onChange: setTexto, placeholder: esAdmin ? 'Buscar por número, asunto o usuario' : 'Buscar por número o asunto' }}
        filters={
          <>
            <Select aria-label="Prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value)} placeholder="Toda prioridad" options={Object.entries(TICKET_PRIORIDAD).map(([value, p]) => ({ value, label: p.label }))} className="w-40" />
            <Select aria-label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Toda categoría" options={Object.entries(TICKET_CATEGORIA).map(([value, label]) => ({ value, label }))} className="w-44" />
            {hayFiltros && (
              <button
                type="button"
                onClick={() => {
                  setEstado('');
                  setPrioridad('');
                  setCategoria('');
                  setTexto('');
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Quitar filtros
              </button>
            )}
          </>
        }
        pagination={tickets.data && { page: tickets.data.page, pages: tickets.data.pages, total: tickets.data.total, onPageChange: setPage }}
        emptyIcon={LifeBuoy}
        emptyTitle={hayFiltros ? 'No hay tickets con esos filtros' : esAdmin ? 'No hay tickets' : 'Aún no tienes tickets'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : esAdmin ? 'Cuando un usuario pida ayuda aparecerá aquí.' : 'Crea un ticket y te respondemos por aquí mismo.'}
      />

      <TicketNuevoModal
        open={nuevo}
        onClose={() => setNuevo(false)}
        onCreated={(t) => {
          setEstado('');
          tickets.recargar();
          abrir(t._id);
        }}
      />
      <TicketConversacion ticketId={abierto} onClose={() => abrir(null)} onChanged={tickets.recargar} />
    </div>
  );
}
