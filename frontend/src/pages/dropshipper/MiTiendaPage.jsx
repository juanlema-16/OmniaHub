import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, ImagePlus, Package, Save, ShoppingBag, Store, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getMyStore, updateMyStore } from '../../api/myStore';
import { getErrorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const MAX_MB = 2;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const ESQUEMA = { nombre: [reglas.requerido('El nombre de la tienda'), reglas.minimo('El nombre de la tienda', 3)] };

export default function MiTiendaPage() {
  const { refresh } = useAuth();
  const { data: tienda, setData, cargando, error } = useAsync(getMyStore, []);
  const [nombre, setNombre] = useState('');
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [quitarLogo, setQuitarLogo] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const archivo = useRef(null);

  useEffect(() => {
    if (tienda) setNombre(tienda.nombre);
  }, [tienda]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const link = tienda ? `${window.location.origin}/tienda/${tienda.slug}` : '';
  const logoActual = quitarLogo ? null : preview || tienda?.logo;
  const hayCambios = tienda && (nombre.trim() !== tienda.nombre || logo || (quitarLogo && tienda.logo));

  const elegirLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TIPOS.includes(file.type)) return setErrores({ logo: 'El logo debe ser una imagen JPG, PNG o WEBP' });
    if (file.size > MAX_MB * 1024 * 1024) return setErrores({ logo: `El logo no puede pesar más de ${MAX_MB} MB` });
    setErrores((er) => ({ ...er, logo: undefined }));
    setLogo(file);
    setQuitarLogo(false);
    setPreview(URL.createObjectURL(file));
    return undefined;
  };

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, { nombre });
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setGuardando(true);
    try {
      const form = new FormData();
      form.append('nombre', nombre.trim());
      if (logo) form.append('logo', logo);
      else if (quitarLogo) form.append('quitarLogo', 'true');
      const actualizada = await updateMyStore(form);
      setData(actualizada);
      setLogo(null);
      setPreview(null);
      setQuitarLogo(false);
      refresh();
      toast.success('Tu tienda se actualizó');
    } catch (err) {
      setErrores(erroresDeApi(err));
      toast.error(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const copiar = () => navigator.clipboard?.writeText(link).then(() => toast.success('Link copiado. Compártelo con tus clientes'));

  if (cargando) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mi tienda" description="Así te ven tus clientes en tu tienda en línea de OmniaHub." />
      {error && <Alert tone="error">{error}</Alert>}

      {tienda && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Productos visibles" value={tienda.productosActivos} icon={Store} tone="indigo" hint={`De ${tienda.productosTotal} importados`} />
            <StatCard label="Ventas desde la tienda" value={tienda.ventasTienda} icon={ShoppingBag} tone="green" hint="Órdenes que hicieron tus clientes en línea" />
            <Link to="/dropshipper/productos" className="block rounded-xl transition-shadow hover:shadow-md">
              <StatCard label="Administrar productos" value="Mis productos" icon={Package} tone="slate" hint="Precios y visibilidad" />
            </Link>
          </div>

          <Card title="Link público" description="Compártelo en redes sociales o por WhatsApp.">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input readOnly value={link} aria-label="Link de tu tienda" onFocus={(e) => e.target.select()} className="h-10 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 font-mono text-sm text-slate-700" />
              <Button variant="secondary" icon={Copy} onClick={copiar}>
                Copiar
              </Button>
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-50 px-4 text-sm font-medium text-primary hover:bg-primary-100">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir
              </a>
            </div>
            <p className="mt-2 text-xs text-slate-500">El link no cambia aunque cambies el nombre de la tienda, así no se rompen los enlaces que ya compartiste.</p>
          </Card>

          <Card title="Datos de la tienda">
            <form onSubmit={guardar} className="grid gap-6 md:grid-cols-[auto_1fr]" noValidate>
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Logo</p>
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                  {logoActual ? <img src={logoActual} alt="Logo de la tienda" className="h-full w-full object-cover" /> : <Store className="h-10 w-10 text-slate-300" aria-hidden="true" />}
                </div>
                <input ref={archivo} type="file" accept={TIPOS.join(',')} className="sr-only" onChange={elegirLogo} aria-label="Elegir logo" />
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="secondary" icon={ImagePlus} onClick={() => archivo.current?.click()}>
                    {logoActual ? 'Cambiar' : 'Subir logo'}
                  </Button>
                  {logoActual && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Quitar logo"
                      onClick={() => {
                        setLogo(null);
                        setPreview(null);
                        setQuitarLogo(Boolean(tienda.logo));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errores.logo ? <p className="mt-1.5 text-xs font-medium text-danger">{errores.logo}</p> : <p className="mt-1.5 text-xs text-slate-500">JPG, PNG o WEBP, hasta {MAX_MB} MB</p>}
              </div>
              <div className="space-y-4">
                <Input
                  label="Nombre de la tienda"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrores((er) => ({ ...er, nombre: undefined }));
                  }}
                  error={errores.nombre}
                  maxLength={60}
                  icon={Store}
                  required
                />
                <Input label="Dirección de la tienda" value={`/tienda/${tienda.slug}`} readOnly disabled hint="Se generó al crear tu cuenta" />
                <div className="flex justify-end">
                  <Button type="submit" icon={Save} loading={guardando} disabled={!hayCambios}>
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
