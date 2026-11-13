import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, IdCard, ImagePlus, ShieldCheck, UserSquare2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import usePrivateImage from '../../hooks/usePrivateImage';
import { getMyKyc, submitKyc } from '../../api/kyc';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import { KycBadge } from '../../components/ui/Badge';
import { formatFechaHora } from '../../utils/dates';

const CAMPOS = [
  { key: 'dpiFrente', label: 'DPI (frente)', ayuda: 'Foto clara del frente de tu DPI, sin reflejos.', icon: IdCard },
  { key: 'dpiReverso', label: 'DPI (reverso)', ayuda: 'Foto del reverso, con el código de barras visible.', icon: IdCard },
  { key: 'selfie', label: 'Selfie con tu DPI', ayuda: 'Tu rostro y el DPI deben verse en la misma foto.', icon: UserSquare2 },
];
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

function Subida({ campo, archivo, error, onChange }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!archivo) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        {campo.label} <span className="text-danger">*</span>
      </p>
      <label
        className={`group relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors ${
          error ? 'border-danger bg-red-50' : preview ? 'border-primary' : 'border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary-50'
        }`}
      >
        <input type="file" accept={TIPOS.join(',')} className="sr-only" onChange={(e) => onChange(campo.key, e.target.files?.[0])} />
        {preview ? (
          <>
            <img src={preview} alt={`Vista previa de ${campo.label}`} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/60 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Cambiar foto</span>
          </>
        ) : (
          <span className="flex flex-col items-center px-4 text-slate-500">
            <ImagePlus className="h-7 w-7 text-slate-400" aria-hidden="true" />
            <span className="mt-2 text-sm font-medium text-primary">Subir foto</span>
            <span className="mt-0.5 text-xs">JPG, PNG o WEBP · máx. {MAX_MB} MB</span>
          </span>
        )}
      </label>
      {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : <p className="mt-1.5 text-xs text-slate-500">{campo.ayuda}</p>}
    </div>
  );
}

function DocumentoEnviado({ label, url }) {
  const { src, error } = usePrivateImage(url);
  return (
    <figure>
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {src ? <img src={src} alt={label} className="h-full w-full object-cover" /> : error ? <p className="p-4 text-xs text-slate-500">No se pudo cargar</p> : <Skeleton className="h-full w-full rounded-none" />}
      </div>
      <figcaption className="mt-1.5 text-xs text-slate-500">{label}</figcaption>
    </figure>
  );
}

const ESTADOS = {
  pendiente: { icon: Clock, tone: 'info', title: 'Documentos en revisión', texto: 'Un administrador está revisando tus documentos. Te notificaremos el resultado.' },
  aprobado: { icon: CheckCircle2, tone: 'success', title: 'Identidad verificada', texto: 'Ya puedes publicar, vender y retirar tu dinero.' },
  rechazado: { icon: XCircle, tone: 'error', title: 'Verificación rechazada' },
};

export default function KycPage() {
  const { refresh } = useAuth();
  const { data: kyc, cargando, error, recargar } = useAsync(getMyKyc, []);
  const [archivos, setArchivos] = useState({});
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const status = kyc?.status;
  const puedeEnviar = status === 'no_enviado' || status === 'rechazado';
  const estado = ESTADOS[status];

  const elegir = (campo, archivo) => {
    if (!archivo) return;
    let mensaje = null;
    if (!TIPOS.includes(archivo.type)) mensaje = 'Debe ser una imagen JPG, PNG o WEBP';
    else if (archivo.size > MAX_MB * 1024 * 1024) mensaje = `La imagen no puede pesar más de ${MAX_MB} MB`;
    setErrores((e) => ({ ...e, [campo]: mensaje }));
    if (!mensaje) setArchivos((a) => ({ ...a, [campo]: archivo }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    const faltantes = Object.fromEntries(CAMPOS.filter((c) => !archivos[c.key]).map((c) => [c.key, 'Sube esta foto']));
    setErrores(faltantes);
    if (Object.keys(faltantes).length) return;
    setEnviando(true);
    try {
      await submitKyc(archivos);
      toast.success('Documentos enviados. Te avisaremos cuando sean revisados');
      setArchivos({});
      await Promise.all([recargar(), refresh()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <PageHeader title="Verificación de identidad" description="Para vender y retirar dinero en OmniaHub necesitamos verificar tu DPI." actions={kyc && <KycBadge status={status} />} />
      {error && <Alert tone="error">{error}</Alert>}
      {cargando && <Skeleton className="h-64 w-full" />}

      {kyc && estado && (
        <Alert tone={estado.tone} title={estado.title} className="mb-6">
          {status === 'rechazado' ? `Motivo: ${kyc.motivoRechazo || 'sin detalle'}. Sube los documentos corregidos.` : estado.texto}
        </Alert>
      )}

      {kyc && !puedeEnviar && (
        <Card title="Documentos enviados" description={kyc.enviadoEn ? `Enviados el ${formatFechaHora(kyc.enviadoEn)}` : undefined}>
          <div className="grid gap-4 sm:grid-cols-3">
            {CAMPOS.map((c) => (
              <DocumentoEnviado key={c.key} label={c.label} url={kyc[c.key]} />
            ))}
          </div>
        </Card>
      )}

      {kyc && puedeEnviar && (
        <Card title="Sube tus documentos" description="Tus fotos solo las ve el equipo de verificación de OmniaHub.">
          <form onSubmit={enviar} noValidate>
            <div className="grid gap-5 sm:grid-cols-3">
              {CAMPOS.map((c) => (
                <Subida key={c.key} campo={c} archivo={archivos[c.key]} error={errores[c.key]} onChange={elegir} />
              ))}
            </div>
            <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Revisamos los documentos en menos de 24 horas.
              </p>
              <Button type="submit" loading={enviando}>
                {enviando ? 'Enviando…' : 'Enviar para revisión'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
