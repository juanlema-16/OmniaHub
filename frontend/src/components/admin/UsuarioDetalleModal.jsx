import { useState } from 'react';
import toast from 'react-hot-toast';
import { Ban, CheckCircle2, Mail, Phone, Store, Truck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Skeleton from '../ui/Skeleton';
import Avatar from '../ui/Avatar';
import Badge, { KycBadge } from '../ui/Badge';
import ConfirmarModal from './ConfirmarModal';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { getUser, setUserStatus } from '../../api/admin';
import { formatQ } from '../../utils/formatQ';
import { formatFecha } from '../../utils/dates';
import { ROLES, necesitaKyc } from '../../utils/constants';

export const ESTADO_CUENTA = {
  pendiente_email: { label: 'Correo sin verificar', tone: 'amber' },
  activo: { label: 'Activa', tone: 'green' },
  bloqueado: { label: 'Bloqueada', tone: 'red' },
};

const Dato = ({ label, children }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
  </div>
);

export default function UsuarioDetalleModal({ userId, onClose, onChange }) {
  const { user: yo } = useAuth();
  const { data, cargando, error, recargar } = useAsync(() => (userId ? getUser(userId) : Promise.resolve(null)), [userId]);
  const [confirmar, setConfirmar] = useState(false);

  const u = data?.user;
  const bloqueada = u?.accountStatus === 'bloqueado';
  const puedeCambiar = u && u.role !== 'admin' && u.accountStatus !== 'pendiente_email' && u._id !== yo?._id;

  const cambiarEstado = async (motivo) => {
    await setUserStatus(u._id, { accountStatus: bloqueada ? 'activo' : 'bloqueado', motivo });
    toast.success(bloqueada ? 'Cuenta desbloqueada' : 'Cuenta bloqueada');
    recargar();
    onChange();
  };

  return (
    <>
      <Modal
        open={Boolean(userId)}
        onClose={onClose}
        size="lg"
        title="Detalle del usuario"
        footer={
          puedeCambiar && (
            <Button variant={bloqueada ? 'success' : 'danger'} icon={bloqueada ? CheckCircle2 : Ban} onClick={() => setConfirmar(true)}>
              {bloqueada ? 'Desbloquear cuenta' : 'Bloquear cuenta'}
            </Button>
          )
        }
      >
        {error && <Alert tone="error">{error}</Alert>}
        {cargando && (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {u && !cargando && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar nombre={u.nombre} apellido={u.apellido} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900">
                  {u.nombre} {u.apellido}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone="indigo">{ROLES[u.role]?.label}</Badge>
                  <Badge tone={ESTADO_CUENTA[u.accountStatus]?.tone} dot>
                    {ESTADO_CUENTA[u.accountStatus]?.label}
                  </Badge>
                  {necesitaKyc(u.role) && <KycBadge status={u.kyc?.status} />}
                </div>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <Dato label="Correo">
                <span className="inline-flex items-center gap-1.5 break-all">
                  <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {u.email}
                </span>
              </Dato>
              <Dato label="Teléfono">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> +502 {u.telefono}
                </span>
              </Dato>
              {u.tienda?.nombre && (
                <Dato label="Tienda">
                  <span className="inline-flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {u.tienda.nombre}
                  </span>
                </Dato>
              )}
              {u.empresa?.nombre && <Dato label="Empresa">{u.empresa.nombre}{u.empresa.nit ? ` · NIT ${u.empresa.nit}` : ''}</Dato>}
              {data.carrier && (
                <Dato label="Transportadora">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {data.carrier.nombre} {data.carrier.activa ? '' : '(inactiva)'}
                  </span>
                </Dato>
              )}
              <Dato label="Registro">{formatFecha(u.createdAt)}</Dato>
              {u.kyc?.status === 'rechazado' && <Dato label="Motivo del rechazo de KYC">{u.kyc.motivoRechazo}</Dato>}
            </dl>

            {data.wallet && (
              <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50 py-3 text-center">
                <div>
                  <p className="text-base font-bold text-slate-900">{formatQ(data.wallet.saldoDisponible)}</p>
                  <p className="text-xs text-slate-500">Disponible</p>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{formatQ(data.wallet.saldoReservado)}</p>
                  <p className="text-xs text-slate-500">Reservado</p>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{formatQ(data.wallet.saldoTotal)}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>
            )}

            {(data.estadisticas.ordenes !== null || data.estadisticas.productos !== null) && (
              <p className="text-sm text-slate-600">
                {data.estadisticas.ordenes !== null && (
                  <span>
                    Órdenes: <strong className="text-slate-900">{data.estadisticas.ordenes}</strong>
                  </span>
                )}
                {data.estadisticas.productos !== null && (
                  <span className="ml-4">
                    Productos publicados: <strong className="text-slate-900">{data.estadisticas.productos}</strong>
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </Modal>

      {u && (
        <ConfirmarModal
          open={confirmar}
          onClose={() => setConfirmar(false)}
          title={bloqueada ? 'Desbloquear cuenta' : 'Bloquear cuenta'}
          description={`${u.nombre} ${u.apellido} · ${u.email}`}
          confirmLabel={bloqueada ? 'Desbloquear' : 'Bloquear'}
          variant={bloqueada ? 'success' : 'danger'}
          motivo={!bloqueada}
          motivoLabel="Motivo del bloqueo"
          onConfirm={cambiarEstado}
        >
          <p className="text-sm text-slate-600">
            {bloqueada ? 'El usuario podrá volver a iniciar sesión y usar la plataforma.' : 'El usuario no podrá usar la plataforma mientras su cuenta esté bloqueada.'}
          </p>
        </ConfirmarModal>
      )}
    </>
  );
}
