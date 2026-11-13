import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Badge, { KycBadge } from '../ui/Badge';
import ConfirmarModal from './ConfirmarModal';
import ImagenPrivada from './ImagenPrivada';
import { reviewKyc } from '../../api/admin';
import { formatFechaHora } from '../../utils/dates';
import { ROLES } from '../../utils/constants';

const DOCUMENTOS = [
  { key: 'dpiFrente', label: 'DPI (frente)' },
  { key: 'dpiReverso', label: 'DPI (reverso)' },
  { key: 'selfie', label: 'Selfie con el DPI' },
];

// Revisión de documentos de identidad: aprobar o rechazar con motivo
export default function KycRevisionModal({ usuario, onClose, onReviewed }) {
  const [accion, setAccion] = useState(null);
  const pendiente = usuario?.kyc?.status === 'pendiente';

  const revisar = async (motivo) => {
    await reviewKyc(usuario._id, { accion, motivo });
    toast.success(accion === 'aprobar' ? 'Identidad aprobada' : 'Verificación rechazada');
    onReviewed();
    onClose();
  };

  return (
    <>
      <Modal
        open={Boolean(usuario)}
        onClose={onClose}
        size="xl"
        title={usuario ? `Verificación de ${usuario.nombre} ${usuario.apellido}` : 'Verificación'}
        description={usuario ? `${usuario.email} · ${ROLES[usuario.role]?.label}` : undefined}
        footer={
          pendiente && (
            <>
              <Button variant="secondary" icon={XCircle} onClick={() => setAccion('rechazar')}>
                Rechazar
              </Button>
              <Button variant="success" icon={CheckCircle2} onClick={() => setAccion('aprobar')}>
                Aprobar
              </Button>
            </>
          )
        }
      >
        {usuario && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <KycBadge status={usuario.kyc.status} />
              {usuario.kyc.enviadoEn && <span>Enviado el {formatFechaHora(usuario.kyc.enviadoEn)}</span>}
              {usuario.tienda?.nombre && <Badge tone="slate">Tienda: {usuario.tienda.nombre}</Badge>}
              {usuario.empresa?.nombre && <Badge tone="slate">Empresa: {usuario.empresa.nombre}</Badge>}
            </div>
            {usuario.kyc.status === 'rechazado' && <Alert tone="error" title="Motivo del rechazo">{usuario.kyc.motivoRechazo}</Alert>}
            <div className="grid gap-4 sm:grid-cols-3">
              {DOCUMENTOS.map((d) => (
                <ImagenPrivada key={d.key} url={usuario.kyc[d.key]} label={d.label} />
              ))}
            </div>
            <p className="text-xs text-slate-500">Compara el rostro de la selfie con el DPI y verifica que los datos sean legibles. Haz clic en una imagen para ampliarla.</p>
          </div>
        )}
      </Modal>

      {usuario && (
        <ConfirmarModal
          open={Boolean(accion)}
          onClose={() => setAccion(null)}
          title={accion === 'aprobar' ? 'Aprobar identidad' : 'Rechazar verificación'}
          description={`${usuario.nombre} ${usuario.apellido} · ${usuario.email}`}
          confirmLabel={accion === 'aprobar' ? 'Aprobar identidad' : 'Rechazar'}
          variant={accion === 'aprobar' ? 'success' : 'danger'}
          motivo={accion === 'rechazar'}
          motivoLabel="Motivo del rechazo"
          onConfirm={revisar}
        >
          <p className="text-sm text-slate-600">
            {accion === 'aprobar'
              ? 'El usuario podrá publicar, vender y retirar dinero. Recibirá una notificación.'
              : 'El usuario recibirá el motivo y podrá subir los documentos de nuevo.'}
          </p>
        </ConfirmarModal>
      )}
    </>
  );
}
