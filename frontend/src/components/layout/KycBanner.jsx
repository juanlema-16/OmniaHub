import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { necesitaKyc } from '../../utils/constants';
import Alert from '../ui/Alert';

const MENSAJES = {
  no_enviado: {
    tone: 'warning',
    title: 'Verifica tu identidad',
    texto: 'Sube tu DPI para poder publicar, vender y retirar tu dinero.',
    boton: 'Verificar ahora',
  },
  pendiente: {
    tone: 'info',
    title: 'Tu verificación está en revisión',
    texto: 'Un administrador revisará tus documentos pronto. Te avisaremos por notificación.',
  },
  rechazado: {
    tone: 'error',
    title: 'Tu verificación fue rechazada',
    boton: 'Enviar de nuevo',
  },
};

// Proveedor y dropshipper sin KYC aprobado ven este aviso en todo su panel
export default function KycBanner() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const status = user?.kyc?.status;
  // En la página de verificación el estado ya se muestra completo
  if (!necesitaKyc(user?.role) || status === 'aprobado' || pathname.endsWith('/kyc')) return null;

  const m = MENSAJES[status] || MENSAJES.no_enviado;
  const texto = status === 'rechazado' ? `Motivo: ${user.kyc?.motivoRechazo || 'sin detalle'}. Corrige tus documentos y envíalos otra vez.` : m.texto;

  return (
    <Alert
      tone={m.tone}
      title={m.title}
      className="mb-6"
      action={
        m.boton ? (
          <Link to={`/${user.role}/kyc`} className="inline-flex h-9 items-center rounded-lg bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            {m.boton}
          </Link>
        ) : null
      }
    >
      {texto}
    </Alert>
  );
}
