import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Switch from '../ui/Switch';
import Alert from '../ui/Alert';
import { createBanner, updateBanner } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import { isoDate } from '../../utils/dates';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

export const UBICACIONES = { LANDING: 'Página de inicio', PANEL: 'Paneles de los usuarios' };
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

const vacio = () => ({ titulo: '', subtitulo: '', link: '', ubicacion: ['LANDING', 'PANEL'], inicio: isoDate(), fin: '', activo: true });

const desdeBanner = (b) => ({
  titulo: b.titulo,
  subtitulo: b.subtitulo || '',
  link: b.link || '',
  ubicacion: b.ubicacion,
  inicio: b.inicio ? isoDate(b.inicio) : isoDate(),
  fin: b.fin ? isoDate(b.fin) : '',
  activo: b.activo,
});

// Crear (banner null) o editar un banner. La imagen viaja como multipart.
export default function BannerFormModal({ open, banner, onClose, onSaved }) {
  const [form, setForm] = useState(vacio);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(banner ? desdeBanner(banner) : vacio());
      setArchivo(null);
      setErrores({});
      setError('');
    }
  }, [open, banner]);

  useEffect(() => {
    if (!archivo) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
    setError('');
  };

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!TIPOS.includes(f.type)) setErrores((er) => ({ ...er, imagen: 'Debe ser una imagen JPG, PNG o WEBP' }));
    else if (f.size > MAX_MB * 1024 * 1024) setErrores((er) => ({ ...er, imagen: `La imagen no puede pesar más de ${MAX_MB} MB` }));
    else {
      setArchivo(f);
      setErrores((er) => ({ ...er, imagen: undefined }));
    }
  };

  const alternarUbicacion = (u) => {
    setForm((f) => ({ ...f, ubicacion: f.ubicacion.includes(u) ? f.ubicacion.filter((x) => x !== u) : [...f.ubicacion, u] }));
    setErrores((er) => ({ ...er, ubicacion: undefined }));
  };

  const esquema = {
    titulo: [reglas.requerido('El título'), reglas.minimo('El título', 3)],
    link: [(v) => (v && !/^(\/|https:\/\/)/.test(v.trim()) ? 'El enlace debe empezar con / o https://' : null)],
    ubicacion: [(v) => (!v.length ? 'Elige al menos una ubicación' : null)],
    inicio: [reglas.requerido('La fecha de inicio', 'a')],
    fin: [
      (v, valores) => (v && valores.inicio && v < valores.inicio ? 'La fecha de fin no puede ser anterior a la de inicio' : null),
      // El backend no permite quitar una fecha de fin ya guardada (multipart no envía null)
      (v) => (banner?.fin && !v ? 'Elige una fecha de fin: no se puede quitar una ya guardada' : null),
    ],
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema, form);
    if (!banner && !archivo) encontrados.imagen = 'Sube la imagen del banner';
    else if (errores.imagen) encontrados.imagen = errores.imagen;
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    const datos = new FormData();
    datos.append('titulo', form.titulo.trim());
    datos.append('subtitulo', form.subtitulo.trim());
    datos.append('link', form.link.trim());
    datos.append('ubicacion', form.ubicacion.join(','));
    // Guatemala es UTC-6 todo el año: el banner empieza a las 00:00 y termina a las 23:59 del día elegido
    datos.append('inicio', `${form.inicio}T00:00:00-06:00`);
    if (form.fin) datos.append('fin', `${form.fin}T23:59:59.999-06:00`);
    datos.append('activo', String(form.activo));
    if (archivo) datos.append('imagen', archivo);

    setEnviando(true);
    try {
      await (banner ? updateBanner(banner._id, datos) : createBanner(datos));
      toast.success(banner ? 'Banner actualizado' : 'Banner creado');
      onSaved();
      onClose();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => !enviando && onClose();
  const imagenActual = preview || banner?.imagen;

  return (
    <Modal
      open={open}
      onClose={cerrar}
      size="lg"
      title={banner ? 'Editar banner' : 'Nuevo banner'}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-banner" icon={Save} loading={enviando}>
            {banner ? 'Guardar cambios' : 'Crear banner'}
          </Button>
        </>
      }
    >
      <form id="form-banner" onSubmit={enviar} className="space-y-4" noValidate>
        {error && !Object.values(errores).some(Boolean) && <Alert tone="error">{error}</Alert>}

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">
            Imagen {!banner && <span className="text-danger">*</span>}
          </p>
          <label
            className={`group relative flex aspect-[3/1] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center ${
              errores.imagen ? 'border-danger bg-red-50' : imagenActual ? 'border-primary' : 'border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary-50'
            }`}
          >
            <input type="file" accept={TIPOS.join(',')} className="sr-only" onChange={elegirArchivo} />
            {imagenActual ? (
              <>
                <img src={imagenActual} alt="Vista previa del banner" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-slate-900/60 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Cambiar imagen</span>
              </>
            ) : (
              <span className="flex flex-col items-center text-slate-500">
                <ImagePlus className="h-7 w-7 text-slate-400" aria-hidden="true" />
                <span className="mt-1 text-sm font-medium text-primary">Subir imagen</span>
                <span className="text-xs">JPG, PNG o WEBP · máx. {MAX_MB} MB · formato panorámico</span>
              </span>
            )}
          </label>
          {errores.imagen && <p className="mt-1.5 text-xs font-medium text-danger">{errores.imagen}</p>}
        </div>

        <Input label="Título" name="titulo" value={form.titulo} onChange={cambiar} error={errores.titulo} maxLength={120} required />
        <Input label="Subtítulo (opcional)" name="subtitulo" value={form.subtitulo} onChange={cambiar} error={errores.subtitulo} maxLength={200} />
        <Input label="Enlace (opcional)" name="link" value={form.link} onChange={cambiar} error={errores.link} placeholder="/registro o https://…" hint="Ruta interna (/…) o URL segura (https://…)" />

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">
            Dónde se muestra <span className="text-danger">*</span>
          </legend>
          <div className="flex flex-wrap gap-4">
            {Object.entries(UBICACIONES).map(([valor, label]) => (
              <label key={valor} className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.ubicacion.includes(valor)} onChange={() => alternarUbicacion(valor)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                {label}
              </label>
            ))}
          </div>
          {errores.ubicacion && <p className="mt-1.5 text-xs font-medium text-danger" role="alert">{errores.ubicacion}</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Visible desde" name="inicio" type="date" value={form.inicio} onChange={cambiar} error={errores.inicio} required />
          <Input label="Visible hasta (opcional)" name="fin" type="date" value={form.fin} min={form.inicio || undefined} onChange={cambiar} error={errores.fin} hint="Incluye todo ese día" />
        </div>
        <Switch checked={form.activo} onChange={(activo) => setForm((f) => ({ ...f, activo }))} label="Banner activo" />
      </form>
    </Modal>
  );
}
