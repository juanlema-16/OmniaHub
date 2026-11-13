import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListOrdered, Mail, Send, Users } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listCustomers } from '../../api/customers';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Alert from '../../components/ui/Alert';
import CrearOrdenModal from '../../components/orders/CrearOrdenModal';
import { DEPARTAMENTOS } from '../../utils/constants';
import { formatFecha } from '../../utils/dates';
import { plural } from '../../utils/plural';

export default function ClientesPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [departamento, setDepartamento] = useState('');
  const [page, setPage] = useState(1);
  const [vender, setVender] = useState(null);
  const consulta = { search: search || undefined, departamento: departamento || undefined, page, limit: 10 };
  const clientes = useAsync(() => listCustomers(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search, departamento]);

  const columnas = [
    {
      key: 'nombre',
      header: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar nombre={c.nombres} apellido={c.apellidos} size="sm" />
          <div>
            <p className="font-medium text-slate-900">
              {c.nombres} {c.apellidos}
            </p>
            <p className="text-xs text-slate-500">{c.telefono}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Correo',
      render: (c) =>
        c.email ? (
          <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-primary" onClick={(e) => e.stopPropagation()}>
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {c.email}
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      render: (c) => (
        <div className="max-w-60">
          <p className="text-slate-800">{[c.municipio, c.departamento].filter(Boolean).join(', ') || '—'}</p>
          {c.direccion && <p className="truncate text-xs text-slate-500">{c.direccion}</p>}
        </div>
      ),
    },
    { key: 'pedidos', header: 'Pedidos', align: 'center', render: (c) => <span className="font-semibold text-slate-900">{c.totalPedidos}</span> },
    { key: 'ultimo', header: 'Último pedido', render: (c) => formatFecha(c.updatedAt) },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Link to={`/dropshipper/ordenes?buscar=${c.telefono}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-100">
            <ListOrdered className="h-4 w-4" aria-hidden="true" /> Pedidos
          </Link>
          <Button size="sm" variant="soft" icon={Send} onClick={() => setVender(c)}>
            Nueva orden
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description={clientes.data ? `${plural(clientes.data.total, 'cliente')}. Se guardan solos cada vez que creas una orden.` : 'Se guardan solos cada vez que creas una orden.'} />
      {clientes.error && <Alert tone="error">{clientes.error}</Alert>}
      <Table
        columns={columnas}
        data={clientes.data?.items || []}
        loading={clientes.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por nombre, teléfono o correo' }}
        filters={<Select aria-label="Departamento" value={departamento} onChange={(e) => setDepartamento(e.target.value)} placeholder="Todos los departamentos" options={DEPARTAMENTOS} className="w-56" />}
        pagination={clientes.data && { page: clientes.data.page, pages: clientes.data.pages, total: clientes.data.total, onPageChange: setPage }}
        emptyIcon={Users}
        emptyTitle={search || departamento ? 'No hay clientes con esos filtros' : 'Aún no tienes clientes'}
        emptyDescription={search || departamento ? 'Prueba con otra búsqueda.' : 'Cuando crees tu primera orden, el cliente aparecerá aquí.'}
      />
      <CrearOrdenModal open={Boolean(vender)} clienteInicial={vender} onClose={() => setVender(null)} />
    </div>
  );
}
