import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, ExternalLink, Plus } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { listTopUps } from '../../api/wallet';
import { fetchPrivateFile } from '../../api/files';
import { getErrorMessage } from '../../api/axios';
import Table from '../ui/Table';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import { METODO_RECARGA, SOLICITUD_ESTADO } from '../../utils/constants';
import { formatFechaHora } from '../../utils/dates';
import { formatQ } from '../../utils/formatQ';

export const abrirComprobante = async (url) => {
  try {
    const blob = await fetchPrivateFile(url);
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (err) {
    toast.error(getErrorMessage(err));
  }
};

// version: contador que la página sube al crear una recarga, para volver a pedir la lista
export default function RecargasTab({ version, onRecargar }) {
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const recargas = useAsync(() => listTopUps({ estado: estado || undefined, page, limit: 10 }), [estado, page, version]);

  useEffect(() => setPage(1), [estado]);

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (r) => <span className="whitespace-nowrap text-slate-600">{formatFechaHora(r.createdAt)}</span> },
    { key: 'metodo', header: 'Método', render: (r) => METODO_RECARGA[r.metodo] || r.metodo },
    { key: 'monto', header: 'Monto', align: 'right', render: (r) => <span className="font-semibold text-slate-900">{formatQ(r.monto)}</span> },
    {
      key: 'estado',
      header: 'Estado',
      render: (r) => (
        <Badge tone={SOLICITUD_ESTADO[r.estado].tone} dot>
          {SOLICITUD_ESTADO[r.estado].label}
        </Badge>
      ),
    },
    {
      key: 'detalle',
      header: 'Detalle',
      render: (r) => (
        <div className="max-w-xs text-xs text-slate-500">
          {r.estado === 'RECHAZADA' && r.motivo && <p className="text-danger">Motivo: {r.motivo}</p>}
          {r.revisadoPor && <p>Revisó {r.revisadoPor.nombre} {r.revisadoPor.apellido}</p>}
          {r.estado === 'PENDIENTE' && <p>Esperando revisión</p>}
        </div>
      ),
    },
    {
      key: 'comprobante',
      header: 'Comprobante',
      render: (r) =>
        r.comprobante ? (
          <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => abrirComprobante(r.comprobante)}>
            Ver
          </Button>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {recargas.error && <Alert tone="error">{recargas.error}</Alert>}
      <Table
        columns={columnas}
        data={recargas.data?.items || []}
        loading={recargas.cargando}
        filters={
          <>
            <Select aria-label="Estado de la recarga" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos los estados" options={Object.entries(SOLICITUD_ESTADO).map(([value, s]) => ({ value, label: s.label }))} className="w-48" />
            <Button icon={Plus} onClick={onRecargar}>
              Recargar saldo
            </Button>
          </>
        }
        pagination={recargas.data && { page: recargas.data.page, pages: recargas.data.pages, total: recargas.data.total, onPageChange: setPage }}
        emptyIcon={Banknote}
        emptyTitle={estado ? 'No hay recargas con ese estado' : 'Aún no has recargado saldo'}
        emptyDescription={estado ? undefined : 'Usa el botón Recargar saldo para agregar dinero a tu billetera.'}
      />
    </div>
  );
}
