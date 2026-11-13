import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import ConfirmarModal from './ConfirmarModal';
import { reviewTopUp, reviewWithdrawal } from '../../api/admin';
import { formatQ } from '../../utils/formatQ';
import { METODO_RECARGA, ROLES, TIPO_CUENTA } from '../../utils/constants';

export const nombreSolicitante = (u) => (u ? `${u.nombre} ${u.apellido}` : 'Usuario eliminado');

const Fila = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right font-medium text-slate-900">{children}</dd>
  </div>
);

// Confirmación de aprobar o rechazar una recarga o un retiro. tipo: 'recarga' | 'retiro'; accion: 'aprobar' | 'rechazar'
export default function RevisionSolicitudModal({ tipo, solicitud, accion, onClose, onReviewed }) {
  const esRecarga = tipo === 'recarga';
  const aprobar = accion === 'aprobar';
  const cuenta = solicitud?.bankAccount;

  const revisar = async (motivo) => {
    const body = { accion, motivo };
    await (esRecarga ? reviewTopUp : reviewWithdrawal)(solicitud._id, body);
    toast.success(
      esRecarga
        ? aprobar ? `Recarga aprobada: se acreditaron ${formatQ(solicitud.monto)}` : 'Recarga rechazada'
        : aprobar ? 'Retiro aprobado: el monto salió de la billetera' : 'Retiro rechazado: el saldo volvió a estar disponible'
    );
    onReviewed();
  };

  const titulo = `${aprobar ? 'Aprobar' : 'Rechazar'} ${esRecarga ? 'recarga' : 'retiro'}`;

  return (
    <ConfirmarModal
      open={Boolean(solicitud && accion)}
      onClose={onClose}
      title={titulo}
      description={solicitud ? `${nombreSolicitante(solicitud.user)} · ${ROLES[solicitud.user?.role]?.label ?? ''}` : undefined}
      confirmLabel={titulo}
      icon={aprobar ? CheckCircle2 : XCircle}
      variant={aprobar ? 'success' : 'danger'}
      motivo={!aprobar}
      motivoLabel="Motivo del rechazo"
      onConfirm={revisar}
    >
      {solicitud && (
        <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-4">
          <Fila label="Monto">
            <span className="text-base">{formatQ(solicitud.monto)}</span>
          </Fila>
          <Fila label="Usuario">{solicitud.user?.email}</Fila>
          {esRecarga ? (
            <Fila label="Método">{METODO_RECARGA[solicitud.metodo] || solicitud.metodo}</Fila>
          ) : (
            <>
              <Fila label="Concepto">{solicitud.concepto}</Fila>
              {cuenta && (
                <>
                  <Fila label="Banco">{cuenta.banco}</Fila>
                  <Fila label="Tipo de cuenta">{TIPO_CUENTA[cuenta.tipoCuenta] || cuenta.tipoCuenta}</Fila>
                  <Fila label="Número de cuenta">{cuenta.numeroCuenta}</Fila>
                  <Fila label="Titular">{cuenta.titular}</Fila>
                </>
              )}
            </>
          )}
        </dl>
      )}
      <p className="text-sm text-slate-600">
        {esRecarga
          ? aprobar ? 'Se acreditará el monto a la billetera del usuario. No se puede deshacer.' : 'El usuario recibirá el motivo del rechazo.'
          : aprobar ? 'Confirma que ya transferiste el dinero a esta cuenta: el monto saldrá definitivamente de la billetera.' : 'El monto reservado volverá al saldo disponible del usuario.'}
      </p>
    </ConfirmarModal>
  );
}
