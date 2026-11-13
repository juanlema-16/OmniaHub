import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, Pencil, Save } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { listPolicies, updatePolicy } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import PoliticaVista from '../../components/admin/PoliticaVista';
import { formatFechaHora } from '../../utils/dates';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const ORDEN = ['terminos-y-condiciones', 'privacidad', 'cookies', 'envios-y-devoluciones'];
const ETIQUETAS = {
  'terminos-y-condiciones': 'Términos y condiciones',
  privacidad: 'Privacidad',
  cookies: 'Cookies',
  'envios-y-devoluciones': 'Envíos y devoluciones',
};

const ESQUEMA = {
  titulo: [reglas.requerido('El título'), reglas.minimo('El título', 3), (v) => (v && v.trim().length > 120 ? 'El título no puede tener más de 120 caracteres' : null)],
  contenido: [reglas.requerido('El contenido'), reglas.minimo('El contenido', 20), (v) => (v && v.trim().length > 20000 ? 'El contenido no puede tener más de 20,000 caracteres' : null)],
};

export default function PoliticasPage() {
  const politicas = useAsync(listPolicies, []);
  const [slug, setSlug] = useState(ORDEN[0]);
  const [modo, setModo] = useState('editar');
  const [form, setForm] = useState({ titulo: '', contenido: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const actual = politicas.data?.find((p) => p.slug === slug);
  const sinCambios = actual && form.titulo === actual.titulo && form.contenido === actual.contenido;

  useEffect(() => {
    if (actual) {
      setForm({ titulo: actual.titulo, contenido: actual.contenido });
      setErrores({});
      setError('');
    }
  }, [slug, politicas.data]);

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setGuardando(true);
    try {
      await updatePolicy(slug, { titulo: form.titulo.trim(), contenido: form.contenido.trim() });
      await politicas.recargar();
      toast.success('Política actualizada: ya se ve en el sitio público');
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const tabs = ORDEN.map((value) => ({ value, label: ETIQUETAS[value] }));

  return (
    <div className="space-y-6">
      <PageHeader title="Políticas" description="Edita los textos legales que ven los visitantes y los usuarios. Usa «## » para los títulos de sección y «- » para listas." />
      <Tabs tabs={tabs} value={slug} onChange={setSlug} />
      {politicas.error && <Alert tone="error">{politicas.error}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {politicas.cargando && !politicas.data && <Skeleton className="h-96 w-full" />}
      {actual && (
        <Card
          title={ETIQUETAS[slug]}
          description={`Última actualización: ${formatFechaHora(actual.actualizadoEn)}${actual.actualizadoPor ? ` por ${actual.actualizadoPor.nombre} ${actual.actualizadoPor.apellido}` : ''}`}
          actions={
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              {[
                { value: 'editar', label: 'Editar', icon: Pencil },
                { value: 'vista', label: 'Vista previa', icon: Eye },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setModo(m.value)}
                  aria-pressed={modo === m.value}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${modo === m.value ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <m.icon className="h-3.5 w-3.5" aria-hidden="true" /> {m.label}
                </button>
              ))}
            </div>
          }
        >
          {modo === 'editar' ? (
            <form onSubmit={guardar} noValidate className="space-y-4">
              <Input label="Título" name="titulo" value={form.titulo} onChange={cambiar} error={errores.titulo} maxLength={120} required />
              <Textarea label="Contenido" name="contenido" value={form.contenido} onChange={cambiar} error={errores.contenido} rows={16} maxLength={20000} hint={`${form.contenido.length.toLocaleString('en-US')} de 20,000 caracteres`} required />
              <Button type="submit" icon={Save} loading={guardando} disabled={Boolean(sinCambios)}>
                Guardar política
              </Button>
            </form>
          ) : (
            <PoliticaVista titulo={form.titulo} contenido={form.contenido} />
          )}
        </Card>
      )}
    </div>
  );
}
