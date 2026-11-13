import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listUsers } from '../../api/admin';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge, { KycBadge } from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import UsuarioDetalleModal, { ESTADO_CUENTA } from '../../components/admin/UsuarioDetalleModal';
import CrearUsuarioModal from '../../components/admin/CrearUsuarioModal';
import { formatQ } from '../../utils/formatQ';
import { formatFecha } from '../../utils/dates';
import { ROLES, necesitaKyc } from '../../utils/constants';

export default function UsuariosPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [page, setPage] = useState(1);
  const [detalle, setDetalle] = useState(null);
  const [crear, setCrear] = useState(false);

  const consulta = { search: search || undefined, role: role || undefined, accountStatus: accountStatus || undefined, page, limit: 10 };
  const usuarios = useAsync(() => listUsers(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search, role, accountStatus]);

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
    {
      key: 'estado',
      header: 'Cuenta',
      render: (u) => (
        <Badge tone={ESTADO_CUENTA[u.accountStatus]?.tone} dot>
          {ESTADO_CUENTA[u.accountStatus]?.label}
        </Badge>
      ),
    },
    { key: 'kyc', header: 'Identidad', render: (u) => (necesitaKyc(u.role) ? <KycBadge status={u.kyc?.status} /> : <span className="text-slate-400">—</span>) },
    { key: 'saldo', header: 'Saldo', align: 'right', render: (u) => (u.saldo === null ? <span className="text-slate-400">—</span> : <span className="font-medium text-slate-900">{formatQ(u.saldo)}</span>) },
    { key: 'fecha', header: 'Registro', render: (u) => <span className="text-slate-600">{formatFecha(u.createdAt)}</span> },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (u) => (
        <Button size="sm" variant="ghost" onClick={() => setDetalle(u._id)} aria-label={`Ver detalle de ${u.nombre} ${u.apellido}`}>
          Ver
        </Button>
      ),
    },
  ];

  const hayFiltros = Boolean(search || role || accountStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Consulta, bloquea o desbloquea cuentas y crea transportadoras y administradores."
        actions={
          <Button icon={Plus} onClick={() => setCrear(true)}>
            Crear usuario
          </Button>
        }
      />
      {usuarios.error && <Alert tone="error">{usuarios.error}</Alert>}
      <Table
        columns={columnas}
        data={usuarios.data?.items || []}
        loading={usuarios.cargando}
        onRowClick={(u) => setDetalle(u._id)}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por nombre, correo, teléfono o tienda' }}
        filters={
          <>
            <Select aria-label="Filtrar por rol" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Todos los roles" options={Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label }))} className="w-44" />
            <Select aria-label="Filtrar por estado de cuenta" value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)} placeholder="Todos los estados" options={Object.entries(ESTADO_CUENTA).map(([value, s]) => ({ value, label: s.label }))} className="w-48" />
          </>
        }
        pagination={usuarios.data && { page: usuarios.data.page, pages: usuarios.data.pages, total: usuarios.data.total, onPageChange: setPage }}
        emptyIcon={Users}
        emptyTitle={hayFiltros ? 'No hay usuarios con esos filtros' : 'Aún no hay usuarios'}
        emptyDescription={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : undefined}
      />
      <UsuarioDetalleModal userId={detalle} onClose={() => setDetalle(null)} onChange={usuarios.recargar} />
      <CrearUsuarioModal open={crear} onClose={() => setCrear(false)} onCreated={usuarios.recargar} />
    </div>
  );
}
