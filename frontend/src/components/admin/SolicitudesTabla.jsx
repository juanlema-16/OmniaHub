import { useEffect, useState } from 'react';
import { Banknote, CheckCircle2, ExternalLink, HandCoins, XCircle } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listTopUps, listWithdrawals } from '../../api/admin';
import Table from '../ui/Table';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import RevisionSolicitudModal, { nombreSolicitante } from './RevisionSolicitudModal';
import { abrirComprobante } from '../wallet/RecargasTab';
import { METODO_RECARGA, ROLES, SOLICITUD_ESTADO, TIPO_CUENTA } from '../../utils/constants';
import { formatFechaHora } from '../../utils/dates';
import { formatQ } from '../../utils/formatQ';

// Tabla de recargas o retiros para el admin. tipo: 'recarga' | 'retiro'; version cambia cuando hay que recargar
export default function SolicitudesTabla({ tipo, version, onChange }) {
  const esRecarga = tipo === 'recarga';
  const [estado, setEstado] = useState('PENDIENTE');
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState({ solicitud: null, accion: null });

  const lista = useAsync(
    () => (esRecarga ? listTopUps : listWithdrawals)({ estado: estado || undefined, search: search || undefined, page, limit: 10 }),
    [esRecarga, estado, search, page, version]
  );
  useEffect(() => setPage(1), [estado, search]);

  const abrir = (solicitud, accion) => setRevision({ solicitud, accion });
  const cerrar = () => setRevision((r) => ({ ...r, accion: null }));

  const solicitante = {
    key: 'usuario',
    header: 'Usuario',
    render: (s) => (
      <div>
        <p className="font-medium text-slate-900">{nombreSolicitante(s.user)}</p>
        <p className="text-xs text-slate-500">
          {s.user?.email} · {ROLES[s.user?.role]?.label}
        </p>
      </div>
    ),
  };
  const monto = { key: 'monto', header: 'Monto', align: 'right', render: (s) => <span className="font-semibold text-slate-900">{formatQ(s.monto)}</span> };
  const fecha = { key: 'fecha', header: 'Solicitada', render: (s) => <span className="text-slate-600">{formatFechaHora(s.createdAt)}</span> };
  const estadoCol = {
    key: 'estado',
    header: 'Estado',
    render: (s) => (
      <div className="space-y-1">
        <Badge tone={SOLICITUD_ESTADO[s.estado].tone} dot>
          {SOLICITUD_ESTADO[s.estado].label}
        </Badge>
        {s.estado === 'RECHAZADA' && s.motivo && <p className="max-w-48 truncate text-xs text-danger" title={s.motivo}>{s.motivo}</p>}
      </div>
    ),
  };
  const acciones = {
    key: 'acciones',
    header: 'Acciones',
    align: 'right',
    render: (s) =>
      s.estado === 'PENDIENTE' ? (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" icon={XCircle} onClick={(e) => { e.stopPropagation(); abrir(s, 'rechazar'); }}>
            Rechazar
          </Button>
          <Button size="sm" variant="success" icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); abrir(s, 'aprobar'); }}>
            Aprobar
          </Button>
        </div>
      ) : (
        <span className="text-xs text-slate-500">{s.revisadoPor ? `Revisó ${s.revisadoPor.nombre}` : ''}</span>
      ),
  };

  const columnas = esRecarga
    ? [
        solicitante,
        monto,
        { key: 'metodo', header: 'Método', render: (s) => METODO_RECARGA[s.metodo] || s.metodo },
        {
          key: 'comprobante',
          header: 'Comprobante',
          render: (s) =>
            s.comprobante ? (
              <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => abrirComprobante(s.comprobante)} aria-label={`Ver comprobante de ${nombreSolicitante(s.user)}`}>
                Ver
              </Button>
            ) : (
              <span className="text-slate-400">Tarjeta simulada</span>
            ),
        },
        fecha,
        estadoCol,
        acciones,
      ]
    : [
        solicitante,
        monto,
        {
          key: 'cuenta',
          header: 'Cuenta bancaria',
          render: (s) =>
            s.bankAccount ? (
              <div className="text-xs text-slate-600">
                <p className="text-sm font-medium text-slate-800">
                  {s.bankAccount.banco} · {TIPO_CUENTA[s.bankAccount.tipoCuenta]}
                </p>
                <p>
                  {s.bankAccount.numeroCuenta} · {s.bankAccount.titular}
                </p>
              </div>
            ) : (
              <span className="text-slate-400">Cuenta eliminada</span>
            ),
        },
        { key: 'concepto', header: 'Concepto', render: (s) => <span className="block max-w-48 truncate text-slate-600" title={s.concepto}>{s.concepto}</span> },
        fecha,
        estadoCol,
        acciones,
      ];

  const etiqueta = esRecarga ? 'recargas' : 'retiros';

  return (
    <div className="space-y-4">
      {lista.error && <Alert tone="error">{lista.error}</Alert>}
      <Table
        columns={columnas}
        data={lista.data?.items || []}
        loading={lista.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por nombre o correo del usuario' }}
        filters={
          <Select aria-label={`Estado de los ${etiqueta}`} value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos los estados" options={Object.entries(SOLICITUD_ESTADO).map(([value, s]) => ({ value, label: s.label }))} className="w-48" />
        }
        pagination={lista.data && { page: lista.data.page, pages: lista.data.pages, total: lista.data.total, onPageChange: setPage }}
        emptyIcon={esRecarga ? Banknote : HandCoins}
        emptyTitle={estado === 'PENDIENTE' && !search ? `No hay ${etiqueta} pendientes` : `No hay ${etiqueta} con esos filtros`}
        emptyDescription={estado === 'PENDIENTE' && !search ? 'Cuando un usuario envíe una solicitud aparecerá aquí.' : 'Prueba con otro estado o búsqueda.'}
      />
      <RevisionSolicitudModal tipo={tipo} solicitud={revision.solicitud} accion={revision.accion} onClose={cerrar} onReviewed={onChange} />
    </div>
  );
}
